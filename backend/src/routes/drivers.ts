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

const statuses = ['available', 'on_trip', 'off_duty', 'suspended'];

router.get('/', async (_req, res) => {
  const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
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
      data: { name, licenseNo, licenseExpiry: new Date(licenseExpiry), safetyScore, status },
    });
    res.status(201).json(driver);
  }
);

router.patch(
  '/:id',
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

router.delete('/:id', param('id').isString(), validate, async (req, res) => {
  await prisma.driver.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as driversRouter };
