import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_req, res) => {
  const [vehicles, drivers, trips, maintenanceCount, fuelLogs] = await Promise.all([
    prisma.vehicle.findMany({ where: { status: { not: 'retired' } } }),
    prisma.driver.findMany(),
    prisma.trip.findMany({ where: { status: { in: ['draft', 'dispatched'] } }, include: { vehicle: true, driver: true } }),
    prisma.maintenanceLog.count(),
    prisma.fuelLog.findMany({ include: { vehicle: true } }),
  ]);

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
  });
});

export { router as dashboardRouter };
