import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const statuses = ['available', 'on_trip', 'in_shop', 'retired'];

router.get('/', async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(vehicles);
});

router.get('/:id', param('id').isString(), validate, async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: { trips: true, maintenanceLogs: true, fuelLogs: true },
  });
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

router.post(
  '/',
  [
    body('model').trim().notEmpty(),
    body('licensePlate').trim().notEmpty(),
    body('capacity').isFloat({ min: 0 }),
    body('odometer').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(statuses),
  ],
  validate,
  async (req, res) => {
    const { model, licensePlate, capacity, odometer = 0, status = 'available' } = req.body;
    const existing = await prisma.vehicle.findUnique({ where: { licensePlate } });
    if (existing) return res.status(400).json({ error: 'License plate already registered' });
    const vehicle = await prisma.vehicle.create({
      data: { model, licensePlate, capacity, odometer, status },
    });
    res.status(201).json(vehicle);
  }
);

router.patch(
  '/:id',
  [
    param('id').isString(),
    body('model').optional().trim().notEmpty(),
    body('licensePlate').optional().trim().notEmpty(),
    body('capacity').optional().isFloat({ min: 0 }),
    body('odometer').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(statuses),
  ],
  validate,
  async (req, res) => {
    const { id } = req.params;
    const { model, licensePlate, capacity, odometer, status } = req.body;
    if (licensePlate) {
      const existing = await prisma.vehicle.findFirst({ where: { licensePlate, NOT: { id } } });
      if (existing) return res.status(400).json({ error: 'License plate already in use' });
    }
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { model, licensePlate, capacity, odometer, status },
    });
    res.json(vehicle);
  }
);

router.delete('/:id', param('id').isString(), validate, async (req, res) => {
  await prisma.vehicle.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as vehiclesRouter };
