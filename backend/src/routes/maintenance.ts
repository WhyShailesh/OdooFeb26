import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { roleMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { CAN_MANAGE_MAINTENANCE } from '../config/roles.js';

const router = Router();
const prisma = new PrismaClient();

function vehicleCompanyWhere(req: AuthRequest) {
  return req.user?.companyId ? { vehicle: { companyId: req.user.companyId } } : {};
}

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get('/', async (req: AuthRequest, res) => {
  const vehicleId = req.query.vehicleId as string | undefined;
  const baseWhere = vehicleCompanyWhere(req);
  const where = vehicleId ? { vehicleId, ...baseWhere } : baseWhere;
  const logs = await prisma.maintenanceLog.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: { vehicle: true },
    orderBy: { date: 'desc' },
  });
  res.json(logs);
});

router.post(
  '/',
  roleMiddleware(...CAN_MANAGE_MAINTENANCE),
  [
    body('vehicleId').trim().notEmpty(),
    body('type').trim().notEmpty(),
    body('cost').isFloat({ min: 0 }),
    body('date').isISO8601(),
    body('notes').optional().trim(),
  ],
  validate,
  async (req: AuthRequest, res) => {
    const { vehicleId, type, cost, date, notes } = req.body;
    const vehicleWhere: any = { id: vehicleId };
    if (req.user?.companyId) vehicleWhere.companyId = req.user.companyId;
    const vehicle = await prisma.vehicle.findFirst({ where: vehicleWhere });
    if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });
    const activeTrip = await prisma.trip.findFirst({
      where: { vehicleId, status: { in: ['draft', 'dispatched'] } },
    });
    if (activeTrip) return res.status(400).json({ error: 'Cannot add maintenance while vehicle has active trip' });

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
  roleMiddleware(...CAN_MANAGE_MAINTENANCE),
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

router.delete('/:id', roleMiddleware(...CAN_MANAGE_MAINTENANCE), param('id').isString(), validate, async (req, res) => {
  await prisma.maintenanceLog.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as maintenanceRouter };
