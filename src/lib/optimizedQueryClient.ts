/**
 * Optimized Query Client Configuration
 *
 * This module provides an enhanced React Query client with:
 * - Privacy-aware caching strategies
 * - Performance monitoring integration
 * - Optimized cache configuration for counselor data
 * - Automatic cache invalidation on user context changes
 */

import { QueryClient } from '@tanstack/react-query';
import {
  privacyAwareCacheConfig,
  generatePrivacyCacheKey,
  invalidateUserCache,
  clearAllUserCache,
} from '@/utils/privacyAwareCache';
import { performanceMonitor, enhanceQueryClientWithMonitoring } from '@/utils/performanceMonitor';

// ============================================================================
// ENHANCED QUERY CLIENT CONFIGURATION
// ============================================================================

/**
 * Create optimized query client with privacy and performance enhancements
 */
export function createOptimizedQueryClient(userContext?: {
  userId: string;
  tenantId: string;
  role: 'ADMIN' | 'COUNSELOR';
}): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Dynamic stale time based on data type and privacy scope
        staleTime: context => {
          const key = context.queryKey;
          const keyString = key.join('.');

          // Interaction data (privacy-sensitive) - shorter stale time
          if (keyString.includes('interactions') || keyString.includes('dashboard')) {
            return userContext?.role === 'COUNSELOR'
              ? 2 * 60 * 1000 // 2 minutes for counselor data
              : 5 * 60 * 1000; // 5 minutes for admin aggregated data
          }

          // Reference data (shared) - longer stale time
          if (
            keyString.includes('students') ||
            keyString.includes('contacts') ||
            keyString.includes('categories')
          ) {
            return 10 * 60 * 1000; // 10 minutes
          }

          // Default stale time
          return 5 * 60 * 1000;
        },

        // Dynamic garbage collection time based on privacy scope
        // gcTime does not support a function — use a fixed default; per-query
        // cache tuning is handled via individual useQuery options instead.
        gcTime: 10 * 60 * 1000, // 10 minutes default

        // Retry configuration optimized for different data types
        retry: (failureCount, error: any) => {
          // Don't retry privacy violations
          if (
            error?.code === 'PRIVACY_VIOLATION' ||
            error?.code === 'CROSS_COUNSELOR_ACCESS_DENIED'
          ) {
            return false;
          }

          // Don't retry authentication errors
          if (error?.code === 'AUTH_ERROR') {
            return false;
          }

          // Retry network errors up to 3 times
          return failureCount < 3;
        },

        // Retry delay with exponential backoff
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Selective refetch on window focus
        refetchOnWindowFocus: query => {
          const key = query.queryKey;
          const keyString = key.join('.');

          // Don't auto-refetch sensitive interaction data
          if (keyString.includes('interactions') || keyString.includes('dashboard')) {
            return false;
          }

          // Auto-refetch reference data
          return true;
        },

        // Don't refetch on mount if data is fresh
        refetchOnMount: query => {
          return query.state.dataUpdatedAt === 0; // Only refetch if no data
        },

        // Refetch on reconnect for critical data
        refetchOnReconnect: query => {
          const key = query.queryKey;
          const keyString = key.join('.');

          // Always refetch user-specific data on reconnect
          if (keyString.includes('counselor') || keyString.includes('dashboard')) {
            return true;
          }

          return 'always';
        },

        // Network mode configuration
        networkMode: 'online',

        // Error handling
        throwOnError: (error: any) => {
          // Throw privacy violations to be handled by error boundaries
          if (error?.code === 'PRIVACY_VIOLATION') {
            return true;
          }
          return false;
        },
      },
      mutations: {
        // Retry mutations once for network errors
        retry: (failureCount, error: any) => {
          if (error?.code === 'PRIVACY_VIOLATION' || error?.code === 'AUTH_ERROR') {
            return false;
          }
          return failureCount < 1;
        },

        // Mutation retry delay
        retryDelay: 1000,

        // Network mode for mutations
        networkMode: 'online',
      },
    },
  });

  // Enhance with performance monitoring
  if (userContext) {
    enhanceQueryClientWithMonitoring(queryClient, userContext);
  }

  // Add global error handler for privacy violations
  queryClient.getQueryCache().subscribe(event => {
    if (event.type === 'updated' && event.query.state.status === 'error' && event.query.state.error) {
      const error = event.query.state.error as any;

      if (error?.code === 'PRIVACY_VIOLATION') {
        console.error('Privacy violation detected:', {
          queryKey: event.query.queryKey,
          error: error.message,
        });

        // Clear potentially compromised cache
        if (userContext) {
          invalidateUserCache(queryClient, userContext);
        }
      }
    }
  });

  return queryClient;
}

// ============================================================================
// QUERY CLIENT MANAGEMENT
// ============================================================================

let globalQueryClient: QueryClient | null = null;
let currentUserContext: { userId: string; tenantId: string; role: 'ADMIN' | 'COUNSELOR' } | null =
  null;

/**
 * Get or create the global query client with current user context
 */
export function getOptimizedQueryClient(userContext?: {
  userId: string;
  tenantId: string;
  role: 'ADMIN' | 'COUNSELOR';
}): QueryClient {
  // If user context changed, recreate the client
  if (
    userContext &&
    (!currentUserContext ||
      currentUserContext.userId !== userContext.userId ||
      currentUserContext.tenantId !== userContext.tenantId ||
      currentUserContext.role !== userContext.role)
  ) {
    // Clear old client if it exists
    if (globalQueryClient) {
      clearAllUserCache(globalQueryClient);
    }

    // Create new client with updated context
    globalQueryClient = createOptimizedQueryClient(userContext);
    currentUserContext = userContext;
  }

  // Create client without context if none provided
  if (!globalQueryClient) {
    globalQueryClient = createOptimizedQueryClient();
  }

  return globalQueryClient;
}

/**
 * Update user context and invalidate relevant caches
 */
export function updateUserContext(newUserContext: {
  userId: string;
  tenantId: string;
  role: 'ADMIN' | 'COUNSELOR';
}): void {
  if (!globalQueryClient) return;

  const oldContext = currentUserContext;
  currentUserContext = newUserContext;

  // If user changed, clear all cache
  if (!oldContext || oldContext.userId !== newUserContext.userId) {
    clearAllUserCache(globalQueryClient);
    return;
  }

  // If tenant changed, clear all cache
  if (oldContext.tenantId !== newUserContext.tenantId) {
    clearAllUserCache(globalQueryClient);
    return;
  }

  // If role changed, invalidate user-specific cache
  if (oldContext.role !== newUserContext.role) {
    invalidateUserCache(globalQueryClient, newUserContext);
  }
}

/**
 * Clear all caches (for logout)
 */
export function clearQueryClient(): void {
  if (globalQueryClient) {
    clearAllUserCache(globalQueryClient);
  }
  currentUserContext = null;
}

// ============================================================================
// PRIVACY-AWARE QUERY KEYS
// ============================================================================

/**
 * Generate privacy-aware query keys for the current user context
 */
export function createPrivacyAwareQueryKeys() {
  if (!currentUserContext) {
    throw new Error('User context not available for privacy-aware query keys');
  }

  return {
    // Interactions (counselor-scoped)
    interactions: (options?: any) =>
      generatePrivacyCacheKey(['interactions', 'optimized', options], currentUserContext!),

    interactionsByStudent: (studentId: string, options?: any) =>
      generatePrivacyCacheKey(['interactions', 'student', studentId, options], currentUserContext!),

    interactionsByContact: (contactId: string, options?: any) =>
      generatePrivacyCacheKey(['interactions', 'contact', contactId, options], currentUserContext!),

    // Dashboard (counselor-scoped)
    dashboardStats: (dateRange?: any) =>
      generatePrivacyCacheKey(['dashboard', 'stats', dateRange], currentUserContext!),

    // Reference data (tenant-scoped)
    referenceData: () => generatePrivacyCacheKey(['referenceData', 'batch'], currentUserContext!),

    students: () => generatePrivacyCacheKey(['students'], currentUserContext!),

    contacts: () => generatePrivacyCacheKey(['contacts'], currentUserContext!),

    categories: () => generatePrivacyCacheKey(['categories'], currentUserContext!),
  };
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Get performance metrics for the current query client
 */
export function getQueryClientMetrics(): {
  totalQueries: number;
  staleQueries: number;
  errorQueries: number;
  cacheSize: number;
} {
  if (!globalQueryClient) {
    return { totalQueries: 0, staleQueries: 0, errorQueries: 0, cacheSize: 0 };
  }

  const cache = globalQueryClient.getQueryCache();
  const queries = cache.getAll();

  return {
    totalQueries: queries.length,
    staleQueries: queries.filter(q => q.isStale()).length,
    errorQueries: queries.filter(q => q.state.status === 'error').length,
    cacheSize: queries.reduce((size, query) => {
      if (query.state.data) {
        return size + JSON.stringify(query.state.data).length;
      }
      return size;
    }, 0),
  };
}

/**
 * Optimize query client performance
 */
export function optimizeQueryClient(): void {
  if (!globalQueryClient) return;

  const cache = globalQueryClient.getQueryCache();
  const queries = cache.getAll();

  // Remove stale queries that haven't been accessed recently
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  queries.forEach(query => {
    if (query.state.dataUpdatedAt < oneHourAgo && query.getObserversCount() === 0) {
      cache.remove(query);
    }
  });

  // Log optimization results in development
  if (import.meta.env.DEV) {
    const newQueryCount = cache.getAll().length;
    console.log(`Query cache optimized: ${queries.length} → ${newQueryCount} queries`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  performanceMonitor,
  privacyAwareCacheConfig,
  generatePrivacyCacheKey,
  invalidateUserCache,
  clearAllUserCache,
};
