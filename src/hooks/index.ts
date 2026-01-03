// React Query hooks
export {
  useStudents,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from './useStudents';

export {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from './useContacts';

export {
  useInteractionsQuery,
  useInteractionQuery,
  useCreateInteraction,
  useUpdateInteraction,
  useDeleteInteraction,
  useCompleteFollowUp,
} from './useInteractionsQuery';

export {
  useReasonCategories,
  useReasonSubcategories,
  useSubcategoriesByCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
} from './useReasonCategories';

// Token cleanup hooks
export { useTokenCleanup, useCleanupStats } from './useTokenCleanup';
export { useTokenPersistence, useTokenValidationCache } from './useTokenPersistence';

// Legacy hooks (for backward compatibility during migration)
export { useInteractions } from './useInteractions';
export { useDashboardStats } from './useDashboardStats';
export { useErrorHandler } from './useErrorHandler';
export { usePermissions } from './usePermissions';
