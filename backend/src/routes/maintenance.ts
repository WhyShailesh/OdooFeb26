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

router.get('/', async (req, res) => {
  const vehicleId = req.query.vehicleId as string | undefined;
  const where = vehicleId ? { vehicleId } : {};
  const logs = await prisma.maintenanceLog.findMany({
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
    body('type').trim().notEmpty(),
    body('cost').isFloat({ min: 0 }),
    body('date').isISO8601(),
    body('notes').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { vehicleId, type, cost, date, notes } = req.body;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });

    const [log] = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: { vehicleId, type, cost, date: new Date(date), notes },
        include: { vehicle: true },
      }),
      prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'in_shop' } }),
    ]);
    res.status(201).json(log);
  }
);

router.patch(
  '/:id/complete',
  param('id').isString(),
  validate,
  async (req, res) => {
    const log = await prisma.maintenanceLog.findUnique({ where: { id: req.params.id }, include: { vehicle: true } });
    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });

    const activeTrips = await prisma.trip.count({ where: { vehicleId: log.vehicleId, status: 'dispatched' } });
    if (activeTrips > 0) return res.status(400).json({ error: 'Vehicle has active trips' });

    await prisma.vehicle.update({ where: { id: log.vehicleId }, data: { status: 'available' } });
    res.json({ message: 'Vehicle back to available' });
  }
);

router.delete('/:id', param('id').isString(), validate, async (req, res) => {
  await prisma.maintenanceLog.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as maintenanceRouter };
