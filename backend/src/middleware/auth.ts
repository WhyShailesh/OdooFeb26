import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  companyId?: string | null;
  driverId?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, email: true, role: true, companyId: true, driverId: true } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = { userId: user.id, email: user.email, role: user.role, companyId: user.companyId, driverId: user.driverId };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role' });
    }
    next();
  };
};
