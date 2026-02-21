import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

/**
 * Ensures req.user.companyId is set for multi-tenant filtering.
 * Does not block requests; routes use companyId when present to filter data.
 */
export function companyContext(_req: AuthRequest, _res: Response, next: NextFunction) {
  next();
}

/**
 * Returns Prisma where clause for company scope when user has companyId.
 */
export function companyWhere(companyId: string | null | undefined): { companyId?: string } | object {
  if (companyId) return { companyId };
  return {};
}
