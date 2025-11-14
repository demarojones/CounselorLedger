import type { User, UserRole } from '@/types/user';

export function hasRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, ['ADMIN']);
}

export function isCounselor(user: User | null): boolean {
  return hasRole(user, ['COUNSELOR']);
}

export function canAccessAdminFeatures(user: User | null): boolean {
  return isAdmin(user);
}

export function canManageUsers(user: User | null): boolean {
  return isAdmin(user);
}

export function canManageReasonCategories(user: User | null): boolean {
  return isAdmin(user);
}

export function canViewAllCounselorData(user: User | null): boolean {
  return isAdmin(user);
}

export function canViewOwnDataOnly(user: User | null): boolean {
  return isCounselor(user) && !isAdmin(user);
}
