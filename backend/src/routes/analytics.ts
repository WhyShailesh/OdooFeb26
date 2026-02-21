import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const router = Router();
const prisma = new PrismaClient();

router.get('/summary', async (_req, res) => {
  const [vehicles, fuelLogs, maintenanceLogs, trips] = await Promise.all([
    prisma.vehicle.findMany({ where: { status: { not: 'retired' } }, include: { fuelLogs: true, maintenanceLogs: true, trips: true } }),
    prisma.fuelLog.findMany({ include: { vehicle: true } }),
    prisma.maintenanceLog.findMany({ include: { vehicle: true } }),
    prisma.trip.findMany({ where: { status: 'completed' }, include: { vehicle: true } }),
  ]);

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((s, m) => s + m.cost, 0);
  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);

  const vehicleStats = vehicles.map((v) => {
    const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
    const vTrips = trips.filter((t) => t.vehicleId === v.id);
    const totalKm = vTrips.length * 150; // simplified; could use odometer delta
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
    };
  });

  res.json({
    totalFuelCost,
    totalMaintenanceCost,
    totalLiters,
    fuelEfficiencyOverall: totalLiters > 0 ? (trips.length * 150) / totalLiters : 0,
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

router.get('/export/csv', async (_req, res) => {
  const [vehicles, drivers, trips, fuelLogs, maintenanceLogs] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.driver.findMany(),
    prisma.trip.findMany({ include: { vehicle: true, driver: true } }),
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

router.get('/export/pdf', async (_req, res) => {
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
