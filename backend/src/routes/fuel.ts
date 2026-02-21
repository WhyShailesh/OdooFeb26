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

router.get('/', async (req, res) => {
  const vehicleId = req.query.vehicleId as string | undefined;
  const where = vehicleId ? { vehicleId } : {};
  const logs = await prisma.fuelLog.findMany({
    where,
    include: { vehicle: true },
    orderBy: { date: 'desc' },
  });
  res.json(logs);
});

router.post(
  '/',
  [
    body('vehicleId').trim().notEmpty(),
    body('liters').isFloat({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
    body('date').isISO8601(),
    body('odometerAtFill').optional().isFloat({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    const { vehicleId, liters, cost, date, odometerAtFill } = req.body;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId,
        liters,
        cost,
        date: new Date(date),
        odometerAtFill: odometerAtFill ?? vehicle.odometer,
      },
      include: { vehicle: true },
    });
    res.status(201).json(log);
  }
);

router.delete('/:id', param('id').isString(), validate, async (req, res) => {
  await prisma.fuelLog.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as fuelRouter };
