import type { Role } from '@/contexts/AuthContext';

export const ROLES = {
  FLEET_MANAGER: 'FLEET_MANAGER',
  DISPATCHER: 'DISPATCHER',
  SAFETY_OFFICER: 'SAFETY_OFFICER',
  FINANCIAL_ANALYST: 'FINANCIAL_ANALYST',
} as const;

export function canManageVehicles(role: Role): boolean {
  return role === ROLES.FLEET_MANAGER;
}

export function canManageDrivers(role: Role): boolean {
  return role === ROLES.FLEET_MANAGER;
}

export function canDispatchTrips(role: Role): boolean {
  return role === ROLES.FLEET_MANAGER || role === ROLES.DISPATCHER;
}

export function canManageMaintenance(role: Role): boolean {
  return role === ROLES.FLEET_MANAGER;
}

export function canManageFuel(role: Role): boolean {
  return role === ROLES.FLEET_MANAGER || role === ROLES.FINANCIAL_ANALYST;
}

export function canViewAnalytics(role: Role): boolean {
  return role === ROLES.FLEET_MANAGER || role === ROLES.FINANCIAL_ANALYST;
}

export function isReadOnly(role: Role): boolean {
  return role === ROLES.SAFETY_OFFICER;
}
