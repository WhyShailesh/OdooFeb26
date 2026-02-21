import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const statuses = ['draft', 'dispatched', 'completed', 'cancelled'];

router.get('/', [query('status').optional().isIn(statuses)], validate, async (req, res) => {
  const { status } = req.query;
  const where = status ? { status } : {};
  const trips = await prisma.trip.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(trips);
});

router.get('/:id', param('id').isString(), validate, async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
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
  [
    body('vehicleId').trim().notEmpty(),
    body('driverId').trim().notEmpty(),
    body('cargoWeight').isFloat({ min: 0 }),
    body('origin').trim().notEmpty(),
    body('destination').trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { vehicleId, driverId, cargoWeight, origin, destination } = req.body;

    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      prisma.driver.findUnique({ where: { id: driverId } }),
    ]);

    if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });
    if (!driver) return res.status(400).json({ error: 'Driver not found' });
    if (vehicle.status !== 'available') return res.status(400).json({ error: 'Vehicle is not available for dispatch' });
    if (driver.status !== 'available') return res.status(400).json({ error: 'Driver is not available' });
    if (new Date(driver.licenseExpiry) < new Date()) return res.status(400).json({ error: 'Driver license has expired' });
    if (cargoWeight > vehicle.capacity) return res.status(400).json({ error: 'Cargo weight exceeds vehicle capacity' });

    const reference = generateReference();
    const trip = await prisma.trip.create({
      data: { reference, vehicleId, driverId, cargoWeight, origin, destination, status: 'draft' },
      include: { vehicle: true, driver: true },
    });
    res.status(201).json(trip);
  }
);

router.patch(
  '/:id/dispatch',
  param('id').isString(),
  validate,
  async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include: { vehicle: true, driver: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'draft') return res.status(400).json({ error: 'Only draft trips can be dispatched' });
    if (trip.vehicle.status !== 'available') return res.status(400).json({ error: 'Vehicle is not available' });
    if (trip.driver.status !== 'available') return res.status(400).json({ error: 'Driver is not available' });
    if (new Date(trip.driver.licenseExpiry) < new Date()) return res.status(400).json({ error: 'Driver license has expired' });

    await prisma.$transaction([
      prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'dispatched', dispatchedAt: new Date() },
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
  [param('id').isString(), body('odometerDelta').optional().isFloat({ min: 0 })],
  validate,
  async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'dispatched') return res.status(400).json({ error: 'Only dispatched trips can be completed' });

    const odometerDelta = req.body.odometerDelta ?? 0;
    await prisma.$transaction([
      prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'completed', completedAt: new Date() },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'available', odometer: { increment: odometerDelta } },
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
  [
    param('id').isString(),
    body('cargoWeight').optional().isFloat({ min: 0 }),
    body('origin').optional().trim().notEmpty(),
    body('destination').optional().trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include: { vehicle: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'draft') return res.status(400).json({ error: 'Only draft trips can be edited' });

    const { cargoWeight, origin, destination } = req.body;
    if (cargoWeight != null && cargoWeight > trip.vehicle.capacity) return res.status(400).json({ error: 'Cargo weight exceeds vehicle capacity' });

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { cargoWeight, origin, destination },
      include: { vehicle: true, driver: true },
    });
    res.json(updated);
  }
);

router.delete('/:id', param('id').isString(), validate, async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip || trip.status !== 'draft') return res.status(400).json({ error: 'Only draft trips can be deleted' });
  await prisma.trip.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as tripsRouter };
