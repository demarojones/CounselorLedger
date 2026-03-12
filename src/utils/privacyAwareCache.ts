/**
 * Privacy-Aware Caching Utilities
 *
 * This module implements caching strategies that respect counselor privacy boundaries:
 * - User-scoped cache keys to prevent cross-counselor data leakage
 * - Automatic cache invalidation on role changes
 * - Privacy-safe cache sharing for shared data (students, contacts)
 * - Cache segmentation by user role and tenant
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

// ============================================================================
// PRIVACY-AWARE CACHE KEY GENERATION
// ============================================================================

/**
 * Generate privacy-aware cache keys that include user context
 */
export function generatePrivacyCacheKey(
  baseKey: readonly string[],
  userContext: {
    userId: string;
    tenantId: string;
    role: 'ADMIN' | 'COUNSELOR';
  }
): readonly string[] {
  // For interactions and user-specific data, include userId in cache key
  if (baseKey[0] === 'interactions' || baseKey[0] === 'dashboard' || baseKey[0] === 'followUps') {
    if (userContext.role === 'COUNSELOR') {
      return [...baseKey, 'counselor', userContext.userId] as const;
    } else {
      // Admins get tenant-wide cache keys
      return [...baseKey, 'admin', userContext.tenantId] as const;
    }
  }

  // For shared data (students, contacts, categories), use tenant-scoped keys
  if (baseKey[0] === 'students' || baseKey[0] === 'contacts' || baseKey[0] === 'categories') {
    return [...baseKey, 'tenant', userContext.tenantId] as const;
  }

  // Default: include tenant context
  return [...baseKey, 'tenant', userContext.tenantId] as const;
}

/**
 * Enhanced query keys with privacy awareness
 */
export const privacyAwareQueryKeys = {
  // Interactions (counselor-scoped)
  interactions: (userContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' }) =>
    generatePrivacyCacheKey(queryKeys.interactions, userContext),

  interaction: (
    id: string,
    userContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' }
  ) => generatePrivacyCacheKey(queryKeys.interaction(id), userContext),

  interactionsByStudent: (
    studentId: string,
    userContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' }
  ) => generatePrivacyCacheKey(queryKeys.interactionsByStudent(studentId), userContext),

  interactionsByContact: (
    contactId: string,
    userContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' }
  ) => generatePrivacyCacheKey(queryKeys.interactionsByContact(contactId), userContext),

  // Dashboard (counselor-scoped)
  dashboardStats: (
    userContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' },
    startDate?: string,
    endDate?: string
  ) => {
    const baseKey = queryKeys.dashboardStats(startDate, endDate);
    // Filter out undefined values
    const filteredKey = baseKey.filter((k): k is string => k !== undefined);
    return generatePrivacyCacheKey(filteredKey, userContext);
  },

  // Follow-ups (counselor-scoped)
  followUps: (userContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' }) =>
    generatePrivacyCacheKey(queryKeys.followUps, userContext),

  // Shared data (tenant-scoped)
  students: (userContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' }) =>
    generatePrivacyCacheKey(queryKeys.students, userContext),

  contacts: (userContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' }) =>
    generatePrivacyCacheKey(queryKeys.contacts, userContext),

  categories: (userContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' }) =>
    generatePrivacyCacheKey(queryKeys.categories, userContext),
};

// ============================================================================
// CACHE INVALIDATION STRATEGIES
// ============================================================================

/**
 * Invalidate all user-specific cache entries when user context changes
 */
export function invalidateUserCache(
  queryClient: QueryClient,
  userContext: {
    userId: string;
    tenantId: string;
    role: 'ADMIN' | 'COUNSELOR';
  }
) {
  // Invalidate interaction-related caches
  queryClient.invalidateQueries({
    queryKey: privacyAwareQueryKeys.interactions(userContext),
  });

  queryClient.invalidateQueries({
    queryKey: privacyAwareQueryKeys.dashboardStats(userContext),
  });

  queryClient.invalidateQueries({
    queryKey: privacyAwareQueryKeys.followUps(userContext),
  });

  // Invalidate any interaction detail caches for this user
  queryClient.invalidateQueries({
    predicate: query => {
      const key = query.queryKey;
      return (
        key.includes('interactions') &&
        key.includes('counselor') &&
        key.includes(userContext.userId)
      );
    },
  });
}

/**
 * Invalidate tenant-wide cache entries (for shared data updates)
 */
export function invalidateTenantCache(
  queryClient: QueryClient,
  tenantId: string,
  dataType: 'students' | 'contacts' | 'categories'
) {
  queryClient.invalidateQueries({
    predicate: query => {
      const key = query.queryKey;
      return key.includes(dataType) && key.includes('tenant') && key.includes(tenantId);
    },
  });
}

/**
 * Clear all cache entries when user logs out or switches tenants
 */
export function clearAllUserCache(queryClient: QueryClient) {
  queryClient.clear();
}

// ============================================================================
// CACHE OPTIMIZATION STRATEGIES
// ============================================================================

/**
 * Prefetch commonly accessed data with privacy awareness
 */
export async function prefetchCommonData(
  queryClient: QueryClient,
  userContext: {
    userId: string;
    tenantId: string;
    role: 'ADMIN' | 'COUNSELOR';
  },
  fetchFunctions: {
    fetchStudentsMinimal: () => Promise<any>;
    fetchContactsMinimal: () => Promise<any>;
    fetchReasonCategories: () => Promise<any>;
  }
) {
  // Prefetch shared reference data (students, contacts, categories)
  const prefetchPromises = [
    queryClient.prefetchQuery({
      queryKey: privacyAwareQueryKeys.students(userContext),
      queryFn: fetchFunctions.fetchStudentsMinimal,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }),
    queryClient.prefetchQuery({
      queryKey: privacyAwareQueryKeys.contacts(userContext),
      queryFn: fetchFunctions.fetchContactsMinimal,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }),
    queryClient.prefetchQuery({
      queryKey: privacyAwareQueryKeys.categories(userContext),
      queryFn: fetchFunctions.fetchReasonCategories,
      staleTime: 30 * 60 * 1000, // 30 minutes (categories change less frequently)
    }),
  ];

  await Promise.allSettled(prefetchPromises);
}

/**
 * Implement cache warming for frequently accessed interaction data
 */
export async function warmInteractionCache(
  queryClient: QueryClient,
  userContext: {
    userId: string;
    tenantId: string;
    role: 'ADMIN' | 'COUNSELOR';
  },
  fetchOptimizedInteractions: (options?: any) => Promise<any>
) {
  // Warm cache with recent interactions (most commonly accessed)
  await queryClient.prefetchQuery({
    queryKey: privacyAwareQueryKeys.interactions(userContext),
    queryFn: () =>
      fetchOptimizedInteractions({
        limit: 20,
        includeNotes: false, // Use minimal fields for list view
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// CACHE MONITORING AND METRICS
// ============================================================================

/**
 * Monitor cache performance and privacy compliance
 */
export function getCacheMetrics(queryClient: QueryClient) {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  const metrics = {
    totalQueries: queries.length,
    privacyAwareQueries: 0,
    counselorScopedQueries: 0,
    tenantScopedQueries: 0,
    staleQueries: 0,
    errorQueries: 0,
  };

  queries.forEach(query => {
    const key = query.queryKey;

    // Count privacy-aware queries
    if (key.includes('counselor') || key.includes('tenant')) {
      metrics.privacyAwareQueries++;
    }

    if (key.includes('counselor')) {
      metrics.counselorScopedQueries++;
    }

    if (key.includes('tenant')) {
      metrics.tenantScopedQueries++;
    }

    if (query.isStale()) {
      metrics.staleQueries++;
    }

    if (query.state.status === 'error') {
      metrics.errorQueries++;
    }
  });

  return metrics;
}

/**
 * Validate cache privacy compliance
 */
export function validateCachePrivacy(
  queryClient: QueryClient,
  currentUserContext: {
    userId: string;
    tenantId: string;
    role: 'ADMIN' | 'COUNSELOR';
  }
): {
  isCompliant: boolean;
  violations: string[];
} {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  const violations: string[] = [];

  queries.forEach(query => {
    const key = query.queryKey;

    // Check for interaction data without proper user scoping
    if (key.includes('interactions') && !key.includes('counselor') && !key.includes('admin')) {
      violations.push(`Interaction query without proper user scoping: ${key.join('.')}`);
    }

    // Check for counselor-scoped data with wrong user ID
    if (
      key.includes('counselor') &&
      currentUserContext.role === 'COUNSELOR' &&
      !key.includes(currentUserContext.userId)
    ) {
      violations.push(`Counselor-scoped query with wrong user ID: ${key.join('.')}`);
    }

    // Check for tenant-scoped data with wrong tenant ID
    if (key.includes('tenant') && !key.includes(currentUserContext.tenantId)) {
      violations.push(`Tenant-scoped query with wrong tenant ID: ${key.join('.')}`);
    }
  });

  return {
    isCompliant: violations.length === 0,
    violations,
  };
}

// ============================================================================
// CACHE CONFIGURATION FOR PRIVACY
// ============================================================================

/**
 * Enhanced query client configuration with privacy-aware defaults
 */
export const privacyAwareCacheConfig = {
  defaultOptions: {
    queries: {
      // Shorter stale time for sensitive interaction data
      staleTime: (context: any) => {
        const key = context.queryKey;
        if (key.includes('interactions') || key.includes('dashboard')) {
          return 2 * 60 * 1000; // 2 minutes for interaction data
        }
        if (key.includes('students') || key.includes('contacts')) {
          return 10 * 60 * 1000; // 10 minutes for reference data
        }
        return 5 * 60 * 1000; // 5 minutes default
      },

      // Shorter cache time for privacy-sensitive data
      gcTime: (context: any) => {
        const key = context.queryKey;
        if (key.includes('counselor')) {
          return 5 * 60 * 1000; // 5 minutes for counselor-specific data
        }
        return 10 * 60 * 1000; // 10 minutes default
      },

      // Don't refetch on window focus for sensitive data to avoid unnecessary API calls
      refetchOnWindowFocus: (context: any) => {
        const key = context.queryKey;
        return !key.includes('interactions'); // Don't auto-refetch interactions
      },
    },
  },
};
