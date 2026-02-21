import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// List notifications for current user (by role and company)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const role = req.user?.role;
  const companyId = req.user?.companyId;
  const where: any = {};
  if (companyId) where.companyId = companyId;
  if (role) where.OR = [{ roleTarget: role }, { roleTarget: null }];
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
});

// Mark as read
router.patch('/:id/read', authMiddleware, param('id').isString(), validate, async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.json({ ok: true });
});

// Mark all as read
router.post('/read-all', authMiddleware, async (req: AuthRequest, res) => {
  const role = req.user?.role;
  const companyId = req.user?.companyId;
  const where: any = { isRead: false };
  if (companyId) where.companyId = companyId;
  if (role) where.OR = [{ roleTarget: role }, { roleTarget: null }];
  await prisma.notification.updateMany({ where, data: { isRead: true } });
  res.json({ ok: true });
});

// Create (Manager only - or system)
router.post(
  '/',
  authMiddleware,
  [body('message').trim().notEmpty(), body('roleTarget').optional().trim()],
  validate,
  async (req: AuthRequest, res) => {
    if (req.user?.role !== 'FLEET_MANAGER') return res.status(403).json({ error: 'Unauthorized role' });
    const { message, roleTarget } = req.body;
    const notification = await prisma.notification.create({
      data: { message, roleTarget: roleTarget || null, companyId: req.user?.companyId ?? undefined },
    });
    res.status(201).json(notification);
  }
);

export { router as notificationsRouter };
