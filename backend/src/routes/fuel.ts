import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { roleMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { CAN_MANAGE_FUEL } from '../config/roles.js';

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
  const logs = await prisma.fuelLog.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: { vehicle: true },
    orderBy: { date: 'desc' },
  });
  res.json(logs);
});

router.post(
  '/',
  roleMiddleware(...CAN_MANAGE_FUEL),
  [
    body('vehicleId').trim().notEmpty(),
    body('liters').isFloat({ min: 0.001 }),
    body('cost').isFloat({ min: 0.001 }),
    body('date').isISO8601(),
    body('odometerAtFill').optional().isFloat({ min: 0 }),
  ],
  validate,
  async (req: AuthRequest, res) => {
    const { vehicleId, liters, cost, date, odometerAtFill } = req.body;
    const vehicleWhere: any = { id: vehicleId };
    if (req.user?.companyId) vehicleWhere.companyId = req.user.companyId;
    const vehicle = await prisma.vehicle.findFirst({ where: vehicleWhere });
    if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });
    if (liters <= 0) return res.status(400).json({ error: 'Fuel must be positive' });
    if (cost <= 0) return res.status(400).json({ error: 'Cost must be positive' });

    const odometer = odometerAtFill ?? vehicle.odometer;
    if (odometer < vehicle.odometer) {
      return res.status(400).json({ error: 'Odometer at fill cannot be less than vehicle current odometer' });
    }

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId,
        liters,
        cost,
        date: new Date(date),
        odometerAtFill: odometer,
      },
      include: { vehicle: true },
    });
    res.status(201).json(log);
  }
);

router.delete('/:id', roleMiddleware(...CAN_MANAGE_FUEL), param('id').isString(), validate, async (req, res) => {
  await prisma.fuelLog.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as fuelRouter };
