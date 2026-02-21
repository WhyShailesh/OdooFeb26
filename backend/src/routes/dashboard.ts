import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

function companyWhere(req: AuthRequest) {
  return req.user?.companyId ? { companyId: req.user.companyId } : {};
}

router.get('/', async (req: AuthRequest, res) => {
  const where = companyWhere(req);
  const vehicleWhere = where.companyId ? { vehicle: where } : {};
  const [vehicles, drivers, trips, maintenanceCount, fuelLogs] = await Promise.all([
    prisma.vehicle.findMany({ where: { ...where, status: { not: 'retired' } } }),
    prisma.driver.findMany({ where }),
    prisma.trip.findMany({ where: { ...where, status: { in: ['draft', 'dispatched'] } }, include: { vehicle: true, driver: true } }),
    vehicleWhere.vehicle ? prisma.maintenanceLog.count({ where: vehicleWhere }) : prisma.maintenanceLog.count(),
    vehicleWhere.vehicle ? prisma.fuelLog.findMany({ where: vehicleWhere, include: { vehicle: true } }) : prisma.fuelLog.findMany({ include: { vehicle: true } }),
  ]);

  const allTrips = await prisma.trip.findMany({ where: { ...where }, select: { status: true, completedAt: true, dispatchedAt: true, tripRevenue: true } });
  const completedTrips = allTrips.filter((t) => t.status === 'completed');
  const deliverySuccessRate = allTrips.length > 0 ? Math.round((completedTrips.length / allTrips.length) * 100) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyFuel = fuelLogs.filter((f) => new Date(f.date) >= today).reduce((s, f) => s + f.cost, 0);
  const dailyTrips = completedTrips.filter((t) => t.completedAt && new Date(t.completedAt) >= today);
  const dailyRevenue = dailyTrips.reduce((s, t) => s + (t.tripRevenue ?? 0), 0);
  const dailyExpenseVsProfit = { expense: dailyFuel, profit: dailyRevenue - dailyFuel, revenue: dailyRevenue };

  const activeFleet = vehicles.filter((v) => v.status === 'available' || v.status === 'on_trip').length;
  const inShop = vehicles.filter((v) => v.status === 'in_shop').length;
  const totalVehicles = vehicles.length;
  const utilizationRate = totalVehicles > 0 ? Math.round((activeFleet / totalVehicles) * 100) : 0;
  const pendingCargo = trips.filter((t) => t.status === 'draft' || t.status === 'dispatched').length;

  res.json({
    activeFleetCount: activeFleet,
    maintenanceAlerts: inShop,
    utilizationRate,
    pendingCargo,
    totalVehicles,
    totalDrivers: drivers.length,
    recentTrips: trips.slice(0, 5),
    maintenanceCount,
    deliverySuccessRate,
    dailyExpenseVsProfit,
  });
});

export { router as dashboardRouter };
