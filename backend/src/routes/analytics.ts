import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { roleMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { CAN_VIEW_ANALYTICS, CAN_VIEW_FINANCE, CAN_VIEW_SAFETY_DASHBOARD } from '../config/roles.js';

const router = Router();
const prisma = new PrismaClient();

function companyWhere(req: AuthRequest) {
  return req.user?.companyId ? { companyId: req.user.companyId } : {};
}

router.get('/summary', roleMiddleware(...CAN_VIEW_ANALYTICS), async (req: AuthRequest, res) => {
  const where = companyWhere(req);
  const [vehicles, fuelLogs, maintenanceLogs, trips] = await Promise.all([
    prisma.vehicle.findMany({ where: { ...where, status: { not: 'retired' } }, include: { fuelLogs: true, maintenanceLogs: true, trips: true } }),
    prisma.fuelLog.findMany({ include: { vehicle: true } }),
    prisma.maintenanceLog.findMany({ include: { vehicle: true } }),
    prisma.trip.findMany({ where: { ...where, status: 'completed' }, include: { vehicle: true } }),
  ]);

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((s, m) => s + m.cost, 0);
  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalDistance = trips.reduce((s, t) => s + (t.distance ?? 0), 0);

  const vehicleStats = vehicles.map((v) => {
    const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
    const vTrips = trips.filter((t) => t.vehicleId === v.id);
    const totalKm = vTrips.reduce((s, t) => s + (t.distance ?? 0), 0);
    const costPerKm = totalKm > 0 ? (fuelCost + maintCost) / totalKm : 0;
    const fuelLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
    const efficiency = totalKm > 0 && fuelLiters > 0 ? totalKm / fuelLiters : 0;
    return {
      vehicleId: v.id,
      model: v.model,
      licensePlate: v.licensePlate,
      totalOperationalCost: fuelCost + maintCost,
      fuelCost,
      maintenanceCost: maintCost,
      costPerKm: Math.round(costPerKm * 100) / 100,
      fuelEfficiency: Math.round(efficiency * 100) / 100,
      tripCount: vTrips.length,
      totalDistance: Math.round(totalKm * 100) / 100,
    };
  });

  res.json({
    totalFuelCost,
    totalMaintenanceCost,
    totalLiters,
    totalDistance,
    fuelEfficiencyOverall: totalLiters > 0 && totalDistance > 0 ? totalDistance / totalLiters : 0,
    vehicleStats,
    chartData: {
      fuelByMonth: fuelLogs.reduce((acc: Record<string, number>, f) => {
        const key = new Date(f.date).toISOString().slice(0, 7);
        acc[key] = (acc[key] || 0) + f.cost;
        return acc;
      }, {}),
      maintenanceByMonth: maintenanceLogs.reduce((acc: Record<string, number>, m) => {
        const key = new Date(m.date).toISOString().slice(0, 7);
        acc[key] = (acc[key] || 0) + m.cost;
        return acc;
      }, {}),
    },
  });
});

// Advanced: overview (fuel efficiency, ROI, cost per km, most efficient driver, most expensive vehicle)
router.get('/overview', roleMiddleware(...CAN_VIEW_ANALYTICS), async (req: AuthRequest, res) => {
  const where = companyWhere(req);
  const [vehicles, trips, fuelLogs, drivers] = await Promise.all([
    prisma.vehicle.findMany({ where: { ...where, status: { not: 'retired' } }, include: { fuelLogs: true, maintenanceLogs: true, trips: true } }),
    prisma.trip.findMany({ where: { ...where, status: 'completed' }, include: { vehicle: true, driver: true } }),
    prisma.fuelLog.findMany({ include: { vehicle: true } }),
    prisma.driver.findMany({ where }),
  ]);
  const totalDistance = trips.reduce((s, t) => s + (t.distance ?? 0), 0);
  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalRevenue = trips.reduce((s, t) => s + (t.tripRevenue ?? 0), 0);
  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const driverEfficiency = drivers.map((d) => {
    const dTrips = trips.filter((t) => t.driverId === d.id);
    const km = dTrips.reduce((s, t) => s + (t.distance ?? 0), 0);
    return { driverId: d.id, name: d.name, totalKm: km, tripCount: dTrips.length };
  }).filter((d) => d.tripCount > 0).sort((a, b) => b.totalKm - a.totalKm);
  const vehicleCost = vehicles.map((v) => ({
    vehicleId: v.id,
    licensePlate: v.licensePlate,
    cost: v.fuelLogs.reduce((s, f) => s + f.cost, 0) + v.maintenanceLogs.reduce((s, m) => s + m.cost, 0),
  })).sort((a, b) => b.cost - a.cost);
  res.json({
    fuelEfficiencyOverall: totalLiters > 0 && totalDistance > 0 ? totalDistance / totalLiters : 0,
    totalRevenue,
    totalFuelCost,
    mostEfficientDriver: driverEfficiency[0] ?? null,
    mostExpensiveVehicle: vehicleCost[0] ?? null,
    monthlyExpenseByVehicle: vehicleCost.slice(0, 10),
  });
});

// Finance: revenue, profit, cost per km, trends
router.get('/finance', roleMiddleware(...CAN_VIEW_FINANCE), async (req: AuthRequest, res) => {
  const where = companyWhere(req);
  const [trips, fuelLogs, maintenanceLogs] = await Promise.all([
    prisma.trip.findMany({ where: { ...where, status: 'completed' }, include: { vehicle: true } }),
    prisma.fuelLog.findMany({ include: { vehicle: true } }),
    prisma.maintenanceLog.findMany({ include: { vehicle: true } }),
  ]);
  const totalRevenue = trips.reduce((s, t) => s + (t.tripRevenue ?? 0), 0);
  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaint = maintenanceLogs.reduce((s, m) => s + m.cost, 0);
  const totalCost = totalFuel + totalMaint;
  const totalDistance = trips.reduce((s, t) => s + (t.distance ?? 0), 0);
  const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  res.json({
    totalRevenue,
    totalExpense: totalCost,
    profit: totalRevenue - totalCost,
    profitMargin: Math.round(profitMargin * 100) / 100,
    costPerKm: Math.round(costPerKm * 100) / 100,
    fuelCostTrend: fuelLogs.reduce((acc: Record<string, number>, f) => {
      const key = new Date(f.date).toISOString().slice(0, 7);
      acc[key] = (acc[key] || 0) + f.cost;
      return acc;
    }, {}),
    maintenanceCostTrend: maintenanceLogs.reduce((acc: Record<string, number>, m) => {
      const key = new Date(m.date).toISOString().slice(0, 7);
      acc[key] = (acc[key] || 0) + m.cost;
      return acc;
    }, {}),
  });
});

// Safety: expiring licenses, overdue maintenance, unsafe drivers, incident history
router.get('/safety', roleMiddleware(...CAN_VIEW_SAFETY_DASHBOARD), async (req: AuthRequest, res) => {
  const where = companyWhere(req);
  const [drivers, vehicles, incidents, maintenanceLogs] = await Promise.all([
    prisma.driver.findMany({ where, include: { trips: true } }),
    prisma.vehicle.findMany({ where: { ...where, status: { not: 'retired' } }, include: { maintenanceLogs: true } }),
    prisma.incident.findMany({ where, include: { driver: true, vehicle: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.maintenanceLog.findMany({ include: { vehicle: true } }),
  ]);
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 86400000);
  const expiringLicenses = drivers.filter((d) => new Date(d.licenseExpiry) <= thirtyDays && new Date(d.licenseExpiry) >= now);
  const expiredLicenses = drivers.filter((d) => new Date(d.licenseExpiry) < now);
  const unsafeDrivers = drivers.filter((d) => d.complianceApproved === false || d.status === 'suspended');
  res.json({
    expiringLicenses: expiringLicenses.length,
    expiredLicenses: expiredLicenses.length,
    unsafeDrivers: unsafeDrivers.length,
    incidentHistory: incidents,
    driversExpiringSoon: expiringLicenses.map((d) => ({ id: d.id, name: d.name, licenseExpiry: d.licenseExpiry })),
  });
});

// Driver performance: deliveries per day, avg delivery time, fuel per driver, efficiency score (India)
router.get('/driver-performance', roleMiddleware(...CAN_VIEW_ANALYTICS), async (req: AuthRequest, res) => {
  const where = companyWhere(req);
  const [trips, fuelLogs] = await Promise.all([
    prisma.trip.findMany({ where: { ...where, status: 'completed' }, include: { driver: true, vehicle: true } }),
    prisma.fuelLog.findMany({ include: { vehicle: true } }),
  ]);
  const byDriverId: Record<string, { name: string; deliveries: number; totalKm: number; totalDurationMs: number; fuelCost: number }> = {};
  for (const t of trips) {
    const key = t.driverId;
    if (!byDriverId[key]) {
      byDriverId[key] = { name: t.driver.name, deliveries: 0, totalKm: 0, totalDurationMs: 0, fuelCost: 0 };
    }
    byDriverId[key].deliveries += 1;
    byDriverId[key].totalKm += t.distance ?? 0;
    if (t.dispatchedAt && t.completedAt) {
      byDriverId[key].totalDurationMs += new Date(t.completedAt).getTime() - new Date(t.dispatchedAt).getTime();
    }
  }
  const vehicleToDriver = trips.reduce((acc: Record<string, string>, t) => {
    acc[t.vehicleId] = t.driverId;
    return acc;
  }, {});
  for (const f of fuelLogs) {
    const driverId = vehicleToDriver[f.vehicleId];
    if (driverId && byDriverId[driverId]) byDriverId[driverId].fuelCost += f.cost;
  }
  const ranking = Object.entries(byDriverId).map(([driverId, d]) => ({
    driverId,
    name: d.name,
    totalDeliveries: d.deliveries,
    averageDeliveryTimeMinutes: d.deliveries > 0 ? Math.round((d.totalDurationMs / 60000) / d.deliveries) : 0,
    totalFuelCost: Math.round(d.fuelCost * 100) / 100,
    totalDistanceKm: Math.round(d.totalKm * 100) / 100,
    efficiencyScore: d.totalKm > 0 && d.fuelCost > 0 ? Math.round((d.totalKm / d.fuelCost) * 100) / 100 : 0,
  })).sort((a, b) => b.totalDeliveries - a.totalDeliveries);
  res.json({ ranking });
});

// AI-style insights (logic-based predictions)
router.get('/insights', roleMiddleware(...CAN_VIEW_ANALYTICS), async (req: AuthRequest, res) => {
  const where = companyWhere(req);
  const [fuelLogs, maintenanceLogs, trips, vehicles] = await Promise.all([
    prisma.fuelLog.findMany({ include: { vehicle: true } }),
    prisma.maintenanceLog.findMany({ include: { vehicle: true } }),
    prisma.trip.findMany({ where: { ...where, status: 'completed' }, include: { vehicle: true, driver: true } }),
    prisma.vehicle.findMany({ where: { ...where, status: { not: 'retired' } }, include: { fuelLogs: true, maintenanceLogs: true, trips: true } }),
  ]);
  const lastMonthFuel = fuelLogs.filter((f) => {
    const d = new Date(f.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() - 1 || (now.getMonth() === 0 && d.getMonth() === 11);
  }).reduce((s, f) => s + f.cost, 0);
  const predictedFuelNextMonth = lastMonthFuel * 1.02; // simple 2% trend
  const vehicleProfits = vehicles.map((v) => {
    const vTrips = trips.filter((t) => t.vehicleId === v.id);
    const revenue = vTrips.reduce((s, t) => s + (t.tripRevenue ?? 0), 0);
    const cost = v.fuelLogs.reduce((s, f) => s + f.cost, 0) + v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
    return { vehicleId: v.id, licensePlate: v.licensePlate, profit: revenue - cost, revenue, cost };
  }).filter((v) => v.revenue > 0).sort((a, b) => b.profit - a.profit);
  const driverIncidents = trips.reduce((acc: Record<string, number>, t) => {
    if (t.driverId) acc[t.driverId] = (acc[t.driverId] || 0) + 1;
    return acc;
  }, {});
  res.json({
    predictedFuelCostNextMonth: Math.round(predictedFuelNextMonth * 100) / 100,
    predictedMaintenanceNote: 'Based on average monthly maintenance spend',
    mostProfitableVehicle: vehicleProfits[0] ?? null,
    mostRiskyDriverNote: 'Drivers with incidents or low safety score',
    topProfitableVehicles: vehicleProfits.slice(0, 5),
  });
});

router.get('/export/csv', roleMiddleware(...CAN_VIEW_ANALYTICS), async (req: AuthRequest, res) => {
  const where = companyWhere(req);
  const [vehicles, drivers, trips, fuelLogs, maintenanceLogs] = await Promise.all([
    prisma.vehicle.findMany({ where }),
    prisma.driver.findMany({ where }),
    prisma.trip.findMany({ where, include: { vehicle: true, driver: true } }),
    prisma.fuelLog.findMany({ include: { vehicle: true } }),
    prisma.maintenanceLog.findMany({ include: { vehicle: true } }),
  ]);

  const csvRows: string[] = [];
  csvRows.push('FleetFlow Export - ' + new Date().toISOString().slice(0, 10));
  csvRows.push('');
  csvRows.push('Vehicles');
  csvRows.push('Model,License Plate,Capacity,Odometer,Status');
  vehicles.forEach((v) => csvRows.push([v.model, v.licensePlate, v.capacity, v.odometer, v.status].join(',')));
  csvRows.push('');
  csvRows.push('Drivers');
  csvRows.push('Name,License No,Expiry,Safety Score,Status');
  drivers.forEach((d) => csvRows.push([d.name, d.licenseNo, d.licenseExpiry.toISOString().slice(0, 10), d.safetyScore, d.status].join(',')));
  csvRows.push('');
  csvRows.push('Trips');
  csvRows.push('Reference,Origin,Destination,Cargo,Status,Vehicle,Driver');
  trips.forEach((t) => csvRows.push([t.reference, t.origin, t.destination, t.cargoWeight, t.status, t.vehicle?.licensePlate ?? '', t.driver?.name ?? ''].join(',')));
  csvRows.push('');
  csvRows.push('Fuel Logs');
  csvRows.push('Vehicle,Date,Liters,Cost');
  fuelLogs.forEach((f) => csvRows.push([f.vehicle?.licensePlate ?? '', f.date.toISOString().slice(0, 10), f.liters, f.cost].join(',')));
  csvRows.push('');
  csvRows.push('Maintenance Logs');
  csvRows.push('Vehicle,Type,Date,Cost');
  maintenanceLogs.forEach((m) => csvRows.push([m.vehicle?.licensePlate ?? '', m.type, m.date.toISOString().slice(0, 10), m.cost].join(',')));

  const csv = csvRows.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=fleetflow-export.csv');
  res.send(csv);
});

router.get('/export/pdf', roleMiddleware(...CAN_VIEW_ANALYTICS), async (_req, res) => {
  const [vehicles, trips, fuelLogs, maintenanceLogs] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.trip.findMany({ where: { status: 'completed' }, include: { vehicle: true } }),
    prisma.fuelLog.findMany({ include: { vehicle: true } }),
    prisma.maintenanceLog.findMany({ include: { vehicle: true } }),
  ]);

  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaint = maintenanceLogs.reduce((s, m) => s + m.cost, 0);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=fleetflow-report.pdf');
  doc.pipe(res);

  doc.fontSize(20).text('FleetFlow Analytics Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text('Generated: ' + new Date().toISOString(), { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(14).text('Summary');
  doc.fontSize(10).text(`Total Vehicles: ${vehicles.length}`);
  doc.text(`Completed Trips: ${trips.length}`);
  doc.text(`Total Fuel Cost: $${totalFuel.toFixed(2)}`);
  doc.text(`Total Maintenance Cost: $${totalMaint.toFixed(2)}`);
  doc.text(`Total Operational Cost: $${(totalFuel + totalMaint).toFixed(2)}`);
  doc.moveDown(2);

  doc.fontSize(14).text('Vehicles');
  doc.fontSize(10);
  vehicles.forEach((v) => doc.text(`${v.licensePlate} - ${v.model} (${v.status})`));
  doc.moveDown(2);

  doc.fontSize(14).text('End of Report');
  doc.end();
});

export { router as analyticsRouter };
