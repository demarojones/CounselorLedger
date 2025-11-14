import { useAuth } from '@/contexts/AuthContext';
import {
  isAdmin,
  isCounselor,
  canAccessAdminFeatures,
  canManageUsers,
  canManageReasonCategories,
  canViewAllCounselorData,
  canViewOwnDataOnly,
} from '@/utils/permissions';

export function usePermissions() {
  const { user } = useAuth();

  return {
    isAdmin: isAdmin(user),
    isCounselor: isCounselor(user),
    canAccessAdminFeatures: canAccessAdminFeatures(user),
    canManageUsers: canManageUsers(user),
    canManageReasonCategories: canManageReasonCategories(user),
    canViewAllCounselorData: canViewAllCounselorData(user),
    canViewOwnDataOnly: canViewOwnDataOnly(user),
  };
}
