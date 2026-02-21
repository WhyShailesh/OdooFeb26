import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { roleMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { CAN_DISPATCH_TRIPS, CAN_APPROVE_TRIP_SAFETY, CAN_EDIT_REVENUE } from '../config/roles.js';

const router = Router();
const prisma = new PrismaClient();

function companyFilter(req: AuthRequest) {
  return req.user?.companyId ? { companyId: req.user.companyId } : {};
}

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const statuses = ['draft', 'dispatched', 'completed', 'cancelled'];

router.get('/', [query('status').optional().isIn(statuses)], validate, async (req: AuthRequest, res) => {
  const { status } = req.query;
  const where: any = companyFilter(req);
  if (status) where.status = status;
  const trips = await prisma.trip.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(trips);
});

router.get('/:id', param('id').isString(), validate, async (req: AuthRequest, res) => {
  const where: any = { id: req.params.id, ...companyFilter(req) };
  const trip = await prisma.trip.findFirst({
    where,
    include: { vehicle: true, driver: true },
  });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

function generateReference() {
  return 'TRP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

router.post(
  '/',
  roleMiddleware(...CAN_DISPATCH_TRIPS),
  [
    body('vehicleId').trim().notEmpty(),
    body('driverId').trim().notEmpty(),
    body('cargoWeight').isFloat({ min: 0 }),
    body('origin').trim().notEmpty(),
    body('destination').trim().notEmpty(),
    body('destinationLat').optional().isFloat(),
    body('destinationLng').optional().isFloat(),
  ],
  validate,
  async (req, res) => {
    const { vehicleId, driverId, cargoWeight, origin, destination, destinationLat, destinationLng } = req.body;

    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      prisma.driver.findUnique({ where: { id: driverId } }),
    ]);

    if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });
    if (!driver) return res.status(400).json({ error: 'Driver not found' });
    if (vehicle.status === 'in_shop') return res.status(400).json({ error: 'Vehicle in maintenance' });
    if (vehicle.status === 'retired') return res.status(400).json({ error: 'Vehicle is retired' });
    if (vehicle.status !== 'available') return res.status(400).json({ error: 'Vehicle is not available for dispatch' });
    if (driver.status === 'suspended') return res.status(400).json({ error: 'Driver is suspended' });
    if (driver.status !== 'available') return res.status(400).json({ error: 'Driver is not available' });
    if (new Date(driver.licenseExpiry) < new Date()) return res.status(400).json({ error: 'Driver license expired' });
    if (cargoWeight > vehicle.capacity) return res.status(400).json({ error: 'Cargo weight exceeds vehicle capacity' });

    const activeTripSameVehicle = await prisma.trip.findFirst({
      where: { vehicleId, status: { in: ['draft', 'dispatched'] } },
    });
    if (activeTripSameVehicle) return res.status(400).json({ error: 'Vehicle already has an active trip' });

    const reference = generateReference();
    const trip = await prisma.trip.create({
      data: {
        reference,
        vehicleId,
        driverId,
        cargoWeight,
        origin,
        destination,
        destinationLat: destinationLat != null ? Number(destinationLat) : undefined,
        destinationLng: destinationLng != null ? Number(destinationLng) : undefined,
        status: 'draft',
        companyId: (req as AuthRequest).user?.companyId ?? undefined,
      },
      include: { vehicle: true, driver: true },
    });
    res.status(201).json(trip);
  }
);

router.patch(
  '/:id/dispatch',
  roleMiddleware(...CAN_DISPATCH_TRIPS),
  param('id').isString(),
  validate,
  async (req: AuthRequest, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include: { vehicle: true, driver: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'draft') return res.status(400).json({ error: 'Only draft trips can be dispatched' });
    if (trip.vehicle.status === 'in_shop') return res.status(400).json({ error: 'Vehicle in maintenance' });
    if (trip.vehicle.status === 'retired') return res.status(400).json({ error: 'Vehicle is retired' });
    if (trip.vehicle.status !== 'available') return res.status(400).json({ error: 'Vehicle is not available' });
    if (trip.driver.status === 'suspended') return res.status(400).json({ error: 'Driver is suspended' });
    if (trip.driver.status !== 'available') return res.status(400).json({ error: 'Driver is not available' });
    if (new Date(trip.driver.licenseExpiry) < new Date()) return res.status(400).json({ error: 'Driver license expired' });
    // Safety approval required (Manager can override)
    if (!trip.safetyApprovedAt && req.user?.role !== 'FLEET_MANAGER') {
      return res.status(400).json({ error: 'Trip requires safety approval before dispatch' });
    }

    const startOdometer = trip.vehicle.odometer ?? 0;
    await prisma.$transaction([
      prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'dispatched', dispatchedAt: new Date(), startOdometer },
      }),
      prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'on_trip' } }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'on_trip' } }),
    ]);

    const updated = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: { vehicle: true, driver: true },
    });
    res.json(updated);
  }
);

router.patch(
  '/:id/complete',
  roleMiddleware(...CAN_DISPATCH_TRIPS),
  [
    param('id').isString(),
    body('startOdometer').isFloat({ min: 0 }),
    body('endOdometer').isFloat({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include: { vehicle: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'dispatched') return res.status(400).json({ error: 'Only dispatched trips can be completed' });

    const { startOdometer, endOdometer } = req.body;
    if (endOdometer <= startOdometer) {
      return res.status(400).json({ error: 'End odometer must be greater than start odometer' });
    }
    const distance = endOdometer - startOdometer;
    if (startOdometer < trip.vehicle.odometer) {
      return res.status(400).json({ error: 'Start odometer cannot be less than vehicle current odometer' });
    }

    await prisma.$transaction([
      prisma.trip.update({
        where: { id: trip.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          startOdometer,
          endOdometer,
          distance,
        },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'available', odometer: endOdometer },
      }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'available' } }),
    ]);

    const updated = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: { vehicle: true, driver: true },
    });
    res.json(updated);
  }
);

router.patch(
  '/:id/cancel',
  roleMiddleware(...CAN_DISPATCH_TRIPS),
  param('id').isString(),
  validate,
  async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status === 'completed' || trip.status === 'cancelled') return res.status(400).json({ error: 'Trip cannot be cancelled' });

    const updates: any[] = [prisma.trip.update({ where: { id: trip.id }, data: { status: 'cancelled' } })];
    if (trip.status === 'dispatched') {
      updates.push(prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'available' } }));
      updates.push(prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'available' } }));
    }
    await prisma.$transaction(updates);

    const updated = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: { vehicle: true, driver: true },
    });
    res.json(updated);
  }
);

router.patch(
  '/:id',
  roleMiddleware(...CAN_DISPATCH_TRIPS),
  [
    param('id').isString(),
    body('cargoWeight').optional().isFloat({ min: 0 }),
    body('origin').optional().trim().notEmpty(),
    body('destination').optional().trim().notEmpty(),
    body('destinationLat').optional().isFloat(),
    body('destinationLng').optional().isFloat(),
  ],
  validate,
  async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include: { vehicle: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'draft') return res.status(400).json({ error: 'Only draft trips can be edited' });

    const { cargoWeight, origin, destination, destinationLat, destinationLng } = req.body;
    if (cargoWeight != null && cargoWeight > trip.vehicle.capacity) return res.status(400).json({ error: 'Cargo weight exceeds vehicle capacity' });

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        cargoWeight,
        origin,
        destination,
        destinationLat: destinationLat != null ? Number(destinationLat) : undefined,
        destinationLng: destinationLng != null ? Number(destinationLng) : undefined,
      },
      include: { vehicle: true, driver: true },
    });
    res.json(updated);
  }
);

// Safety Officer / Manager: approve trip for dispatch (vehicle condition, driver fitness, documents)
router.patch(
  '/:id/approve-safety',
  roleMiddleware(...CAN_APPROVE_TRIP_SAFETY),
  param('id').isString(),
  validate,
  async (req: AuthRequest, res) => {
    const where: any = { id: req.params.id, ...companyFilter(req) };
    const trip = await prisma.trip.findFirst({ where });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'draft') return res.status(400).json({ error: 'Only draft trips can be safety-approved' });
    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { safetyApprovedAt: new Date() },
      include: { vehicle: true, driver: true },
    });
    res.json(updated);
  }
);

// Financial Analyst / Manager: set trip revenue
router.patch(
  '/:id/revenue',
  roleMiddleware(...CAN_EDIT_REVENUE),
  [param('id').isString(), body('tripRevenue').isFloat({ min: 0 })],
  validate,
  async (req: AuthRequest, res) => {
    const where: any = { id: req.params.id, ...companyFilter(req) };
    const trip = await prisma.trip.findFirst({ where });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { tripRevenue: req.body.tripRevenue },
      include: { vehicle: true, driver: true },
    });
    res.json(updated);
  }
);

router.delete('/:id', roleMiddleware(...CAN_DISPATCH_TRIPS), param('id').isString(), validate, async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip || trip.status !== 'draft') return res.status(400).json({ error: 'Only draft trips can be deleted' });
  await prisma.trip.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as tripsRouter };
