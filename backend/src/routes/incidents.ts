import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { roleMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { CAN_MANAGE_INCIDENTS } from '../config/roles.js';

const router = Router();
const prisma = new PrismaClient();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const incidentTypes = ['accident', 'damage', 'violation', 'overspeeding', 'late_delivery_risk'];
const severities = ['low', 'medium', 'high', 'critical'];

function companyFilter(req: AuthRequest) {
  return req.user?.companyId ? { companyId: req.user.companyId } : {};
}

router.get('/', roleMiddleware(...CAN_MANAGE_INCIDENTS), async (req: AuthRequest, res) => {
  const where: any = companyFilter(req);
  const type = req.query.type as string;
  if (type) where.type = type;
  const incidents = await prisma.incident.findMany({
    where,
    include: { vehicle: true, driver: true, trip: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(incidents);
});

router.get('/:id', roleMiddleware(...CAN_MANAGE_INCIDENTS), param('id').isString(), validate, async (req: AuthRequest, res) => {
  const where: any = { id: req.params.id, ...companyFilter(req) };
  const incident = await prisma.incident.findFirst({
    where,
    include: { vehicle: true, driver: true, trip: true },
  });
  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  res.json(incident);
});

router.post(
  '/',
  roleMiddleware(...CAN_MANAGE_INCIDENTS),
  [
    body('type').isIn(incidentTypes),
    body('description').trim().notEmpty(),
    body('severity').optional().isIn(severities),
    body('vehicleId').optional().trim(),
    body('driverId').optional().trim(),
    body('tripId').optional().trim(),
  ],
  validate,
  async (req: AuthRequest, res) => {
    const { type, description, severity = 'medium', vehicleId, driverId, tripId } = req.body;
    const incident = await prisma.incident.create({
      data: {
        type,
        description,
        severity,
        vehicleId: vehicleId || undefined,
        driverId: driverId || undefined,
        tripId: tripId || undefined,
        companyId: req.user?.companyId ?? undefined,
      },
      include: { vehicle: true, driver: true, trip: true },
    });
    res.status(201).json(incident);
  }
);

router.delete('/:id', roleMiddleware(...CAN_MANAGE_INCIDENTS), param('id').isString(), validate, async (req: AuthRequest, res) => {
  const where: any = { id: req.params.id, ...companyFilter(req) };
  await prisma.incident.deleteMany({ where });
  res.status(204).send();
});

export { router as incidentsRouter };
