import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { roleMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { CAN_MANAGE_DRIVERS, CAN_MANAGE_COMPLIANCE } from '../config/roles.js';

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

const statuses = ['available', 'on_trip', 'off_duty', 'suspended'];

router.get('/', async (req: AuthRequest, res) => {
  const where = companyFilter(req);
  const drivers = await prisma.driver.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(drivers);
});

router.get('/:id', param('id').isString(), validate, async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
    include: { trips: true },
  });
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  res.json(driver);
});

router.post(
  '/',
  roleMiddleware(...CAN_MANAGE_DRIVERS),
  [
    body('name').trim().notEmpty(),
    body('licenseNo').trim().notEmpty(),
    body('licenseExpiry').isISO8601(),
    body('safetyScore').optional().isFloat({ min: 0, max: 100 }),
    body('status').optional().isIn(statuses),
  ],
  validate,
  async (req, res) => {
    const { name, licenseNo, licenseExpiry, safetyScore = 100, status = 'available' } = req.body;
    const existing = await prisma.driver.findUnique({ where: { licenseNo } });
    if (existing) return res.status(400).json({ error: 'License number already registered' });
    const driver = await prisma.driver.create({
      data: {
        name,
        licenseNo,
        licenseExpiry: new Date(licenseExpiry),
        safetyScore,
        status,
        companyId: (req as AuthRequest).user?.companyId ?? undefined,
      },
    });
    res.status(201).json(driver);
  }
);

router.patch(
  '/:id',
  roleMiddleware(...CAN_MANAGE_DRIVERS),
  [
    param('id').isString(),
    body('name').optional().trim().notEmpty(),
    body('licenseNo').optional().trim().notEmpty(),
    body('licenseExpiry').optional().isISO8601(),
    body('safetyScore').optional().isFloat({ min: 0, max: 100 }),
    body('status').optional().isIn(statuses),
  ],
  validate,
  async (req, res) => {
    const { id } = req.params;
    const { name, licenseNo, licenseExpiry, safetyScore, status } = req.body;
    const data: any = { name, safetyScore, status };
    if (licenseExpiry) data.licenseExpiry = new Date(licenseExpiry);
    if (licenseNo) {
      const existing = await prisma.driver.findFirst({ where: { licenseNo, NOT: { id } } });
      if (existing) return res.status(400).json({ error: 'License number already in use' });
      data.licenseNo = licenseNo;
    }
    const driver = await prisma.driver.update({ where: { id }, data });
    res.json(driver);
  }
);

// Safety Officer / Manager: approve driver, set fit/unfit, suspend
router.patch(
  '/:id/compliance',
  roleMiddleware(...CAN_MANAGE_COMPLIANCE),
  [
    param('id').isString(),
    body('complianceApproved').optional().isBoolean(),
    body('complianceNotes').optional().trim(),
    body('status').optional().isIn(statuses),
  ],
  validate,
  async (req: AuthRequest, res) => {
    const where: any = { id: req.params.id, ...companyFilter(req) };
    const driver = await prisma.driver.findFirst({ where });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    const { complianceApproved, complianceNotes, status } = req.body;
    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: { complianceApproved, complianceNotes, status },
    });
    res.json(updated);
  }
);

router.delete('/:id', roleMiddleware(...CAN_MANAGE_DRIVERS), param('id').isString(), validate, async (req, res) => {
  await prisma.driver.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as driversRouter };
