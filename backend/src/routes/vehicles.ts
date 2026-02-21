import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { roleMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { CAN_MANAGE_VEHICLES, CAN_VIEW_VEHICLES } from '../config/roles.js';

const router = Router();
const prisma = new PrismaClient();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const statuses = ['available', 'on_trip', 'in_shop', 'retired'];

function companyFilter(req: AuthRequest) {
  return req.user?.companyId ? { companyId: req.user.companyId } : {};
}

router.get('/', async (req: AuthRequest, res) => {
  const where = companyFilter(req);
  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { trips: true } } },
  });
  res.json(vehicles);
});

// Live map: vehicle locations (lat, long, driver, status)
router.get('/locations', roleMiddleware(...CAN_VIEW_VEHICLES), async (req: AuthRequest, res) => {
  const where = companyFilter(req);
  const vehicles = await prisma.vehicle.findMany({
    where: { ...where, OR: [{ latitude: { not: null } }, { status: 'on_trip' }] },
    include: { trips: { where: { status: 'dispatched' }, take: 1, include: { driver: true } } },
  });
  const locations = vehicles.map((v) => ({
    id: v.id,
    model: v.model,
    licensePlate: v.licensePlate,
    status: v.status,
    latitude: v.latitude,
    longitude: v.longitude,
    lastLocationAt: v.lastLocationAt,
    driver: v.trips[0]?.driver ? { id: v.trips[0].driver.id, name: v.trips[0].driver.name } : null,
  }));
  res.json(locations);
});

// Live tracking: full truck details for map (speed, destination, fuel efficiency, profit)
// Returns all vehicles: available, on_trip, in_shop, retired (no status filter)
router.get('/live', roleMiddleware(...CAN_VIEW_VEHICLES), async (req: AuthRequest, res) => {
  try {
    const where = companyFilter(req);
    const vehicles = await prisma.vehicle.findMany({
      where: { ...where },
      include: {
        trips: { where: { status: 'dispatched' }, take: 1, include: { driver: true } },
        fuelLogs: true,
        maintenanceLogs: true,
      },
    });
    const completedTrips = await prisma.trip.findMany({
      where: { ...where, status: 'completed' },
      select: { vehicleId: true, tripRevenue: true, distance: true, estimatedFuelCost: true },
    });
    const defaultCenter = { lat: 23.0225, lng: 72.5714 };
    const list = vehicles.map((v, index) => {
      const currentTrip = v.trips[0];
      const vCompleted = completedTrips.filter((t) => t.vehicleId === v.id);
      const totalRevenue = vCompleted.reduce((s, t) => s + (t.tripRevenue ?? 0), 0);
      const totalFuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const totalMaintCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
      const totalProfit = totalRevenue - totalFuelCost - totalMaintCost;
      const totalKm = vCompleted.reduce((s, t) => s + (t.distance ?? 0), 0);
      const totalLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
      const fuelEfficiency = totalLiters > 0 && totalKm > 0 ? Math.round((totalKm / totalLiters) * 100) / 100 : (v.mileage ?? 0);
      const offset = index * 0.002;
      return {
        id: v.id,
        vehicleName: v.model,
        licensePlate: v.licensePlate,
        driverName: currentTrip?.driver?.name ?? null,
        status: v.status,
        latitude: v.latitude ?? defaultCenter.lat + (index % 5) * 0.005,
        longitude: v.longitude ?? defaultCenter.lng + Math.floor(index / 5) * 0.005,
        speed: v.speed,
        lastUpdated: v.lastUpdated ?? v.lastLocationAt,
        currentTripDestination: currentTrip?.destination ?? null,
        fuelEfficiency,
        totalProfit: Math.round(totalProfit * 100) / 100,
        odometer: v.odometer,
      };
    });
    res.json(list);
  } catch (e) {
    console.error('GET /vehicles/live error:', e);
    res.status(500).json({ error: 'Failed to fetch live vehicles' });
  }
});

router.get('/:id', param('id').isString(), validate, async (req: AuthRequest, res) => {
  const where: any = { id: req.params.id, ...companyFilter(req) };
  const vehicle = await prisma.vehicle.findFirst({
    where,
    include: { trips: true, maintenanceLogs: true, fuelLogs: true },
  });
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

router.post(
  '/',
  roleMiddleware(...CAN_MANAGE_VEHICLES),
  [
    body('model').trim().notEmpty(),
    body('licensePlate').trim().notEmpty(),
    body('capacity').isFloat({ min: 0 }),
    body('odometer').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(statuses),
    body('mileage').optional().isFloat({ min: 0 }),
    body('fuelType').optional().isIn(['petrol', 'diesel']),
  ],
  validate,
  async (req, res) => {
    const { model, licensePlate, capacity, odometer = 0, status = 'available', mileage, fuelType } = req.body;
    const existing = await prisma.vehicle.findUnique({ where: { licensePlate } });
    if (existing) return res.status(400).json({ error: 'License plate already registered' });
    const vehicle = await prisma.vehicle.create({
      data: {
        model,
        licensePlate,
        capacity,
        odometer,
        status,
        mileage: mileage != null ? Number(mileage) : undefined,
        fuelType: fuelType || undefined,
        companyId: (req as AuthRequest).user?.companyId ?? undefined,
      },
    });
    res.status(201).json(vehicle);
  }
);

router.patch(
  '/:id',
  roleMiddleware(...CAN_MANAGE_VEHICLES),
  [
    param('id').isString(),
    body('model').optional().trim().notEmpty(),
    body('licensePlate').optional().trim().notEmpty(),
    body('capacity').optional().isFloat({ min: 0 }),
    body('odometer').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(statuses),
    body('mileage').optional().isFloat({ min: 0 }),
    body('fuelType').optional().isIn(['petrol', 'diesel']),
  ],
  validate,
  async (req, res) => {
    const { id } = req.params;
    const { model, licensePlate, capacity, odometer, status, mileage, fuelType } = req.body;
    const current = await prisma.vehicle.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Vehicle not found' });
    if (licensePlate) {
      const existing = await prisma.vehicle.findFirst({ where: { licensePlate, NOT: { id } } });
      if (existing) return res.status(400).json({ error: 'License plate already in use' });
    }
    if (odometer != null && odometer < current.odometer) {
      return res.status(400).json({ error: 'Odometer cannot be decreased' });
    }
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { model, licensePlate, capacity, odometer, status, mileage, fuelType },
    });
    res.json(vehicle);
  }
);

router.delete('/:id', roleMiddleware(...CAN_MANAGE_VEHICLES), param('id').isString(), validate, async (req, res) => {
  const id = req.params.id;
  const where = companyFilter(req as AuthRequest);
  const vehicle = await prisma.vehicle.findFirst({ where: { id, ...where } });
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const trips = await prisma.trip.count({ where: { vehicleId: id } });

  if (trips > 0) {
    const updated = await prisma.vehicle.update({
      where: { id },
      data: { status: 'retired' },
    });
    return res.status(200).json({
      message: 'Vehicle has trip history and cannot be deleted. Marked as retired.',
      vehicle: updated,
    });
  }

  await prisma.vehicle.delete({ where: { id } });
  res.status(204).send();
});

export { router as vehiclesRouter };
