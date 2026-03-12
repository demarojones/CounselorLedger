/**
 * Optimized Interactions Hook with Privacy-Aware Caching
 *
 * This hook implements performance optimizations for interaction queries:
 * - Uses optimized API with selective field loading
 * - Implements privacy-aware caching strategies
 * - Supports pagination and filtering
 * - Provides efficient data loading patterns
 */

import React from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchOptimizedInteractions,
  fetchOptimizedStudentInteractions,
  fetchOptimizedContactInteractions,
  batchLoadReferenceData,
} from '@/services/optimizedApi';
import {
  privacyAwareQueryKeys,
  invalidateUserCache,
  warmInteractionCache,
  prefetchCommonData,
} from '@/utils/privacyAwareCache';

// ============================================================================
// OPTIMIZED INTERACTIONS QUERY
// ============================================================================

interface UseOptimizedInteractionsOptions {
  limit?: number;
  includeNotes?: boolean;
  dateRange?: { start: string; end: string };
  categoryId?: string;
  studentId?: string;
  contactId?: string;
  followUpStatus?: 'pending' | 'overdue' | 'completed';
  enabled?: boolean;
}

/**
 * Hook for fetching interactions with performance optimizations
 */
export function useOptimizedInteractions(options: UseOptimizedInteractionsOptions = {}) {
  const { user } = useAuth();
  // queryClient is available for future use
  // const queryClient = useQueryClient();

  const userContext = user
    ? {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role as 'ADMIN' | 'COUNSELOR',
      }
    : null;

  return useQuery({
    queryKey: userContext
      ? [...privacyAwareQueryKeys.interactions(userContext), 'optimized', options]
      : ['interactions', 'optimized', 'unauthenticated'],
    queryFn: () => fetchOptimizedInteractions(options),
    enabled: !!userContext && options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes for interaction data
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchOnWindowFocus: false, // Don't auto-refetch sensitive data
    select: data => data.data, // Extract the data from the response wrapper
  });
}

// ============================================================================
// INFINITE SCROLL INTERACTIONS
// ============================================================================

/**
 * Hook for infinite scroll interactions with performance optimizations
 */
export function useInfiniteInteractions(
  baseOptions: Omit<UseOptimizedInteractionsOptions, 'limit'> = {}
) {
  const { user } = useAuth();
  const PAGE_SIZE = 20;

  const userContext = user
    ? {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role as 'ADMIN' | 'COUNSELOR',
      }
    : null;

  return useInfiniteQuery({
    queryKey: userContext
      ? [...privacyAwareQueryKeys.interactions(userContext), 'infinite', baseOptions]
      : ['interactions', 'infinite', 'unauthenticated'],
    queryFn: ({ pageParam = 0 }) =>
      fetchOptimizedInteractions({
        ...baseOptions,
        limit: PAGE_SIZE,
        offset: pageParam * PAGE_SIZE,
      }),
    enabled: !!userContext,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.data) return undefined;
      const { totalCount } = lastPage.data;
      const loadedCount = allPages.reduce(
        (sum, page) => sum + (page.data?.interactions.length || 0),
        0
      );
      return loadedCount < totalCount ? allPages.length : undefined;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// STUDENT INTERACTION HISTORY
// ============================================================================

/**
 * Hook for fetching student interaction history with optimizations
 */
export function useOptimizedStudentInteractions(
  studentId: string,
  options: {
    limit?: number;
    includeNotes?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { user } = useAuth();

  const userContext = user
    ? {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role as 'ADMIN' | 'COUNSELOR',
      }
    : null;

  return useQuery({
    queryKey: userContext
      ? [
          ...privacyAwareQueryKeys.interactionsByStudent(studentId, userContext),
          'optimized',
          options,
        ]
      : ['interactions', 'student', studentId, 'unauthenticated'],
    queryFn: () => fetchOptimizedStudentInteractions(studentId, options),
    enabled: !!userContext && !!studentId && options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes for student history
    gcTime: 10 * 60 * 1000,
    select: data => data.data,
  });
}

// ============================================================================
// CONTACT INTERACTION HISTORY
// ============================================================================

/**
 * Hook for fetching contact interaction history with optimizations
 */
export function useOptimizedContactInteractions(
  contactId: string,
  options: {
    limit?: number;
    includeNotes?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { user } = useAuth();

  const userContext = user
    ? {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role as 'ADMIN' | 'COUNSELOR',
      }
    : null;

  return useQuery({
    queryKey: userContext
      ? [
          ...privacyAwareQueryKeys.interactionsByContact(contactId, userContext),
          'optimized',
          options,
        ]
      : ['interactions', 'contact', contactId, 'unauthenticated'],
    queryFn: () => fetchOptimizedContactInteractions(contactId, options),
    enabled: !!userContext && !!contactId && options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes for contact history
    gcTime: 10 * 60 * 1000,
    select: data => data.data,
  });
}

// ============================================================================
// REFERENCE DATA BATCH LOADING
// ============================================================================

/**
 * Hook for batch loading reference data (students, contacts, categories)
 */
export function useReferenceData() {
  const { user } = useAuth();

  const userContext = user
    ? {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role as 'ADMIN' | 'COUNSELOR',
      }
    : null;

  return useQuery({
    queryKey: userContext
      ? ['referenceData', 'batch', userContext.tenantId]
      : ['referenceData', 'batch', 'unauthenticated'],
    queryFn: batchLoadReferenceData,
    enabled: !!userContext,
    staleTime: 10 * 60 * 1000, // 10 minutes for reference data
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    select: data => data.data,
  });
}

// ============================================================================
// CACHE WARMING AND PREFETCHING
// ============================================================================

/**
 * Hook for warming interaction cache on app initialization
 */
export function useWarmCache() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userContext = user
    ? {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role as 'ADMIN' | 'COUNSELOR',
      }
    : null;

  // Warm cache when user context is available
  React.useEffect(() => {
    if (!userContext) return;

    const warmCache = async () => {
      try {
        // Prefetch common reference data
        await prefetchCommonData(queryClient, userContext, {
          fetchStudentsMinimal: () => batchLoadReferenceData().then(r => r.data?.students || []),
          fetchContactsMinimal: () => batchLoadReferenceData().then(r => r.data?.contacts || []),
          fetchReasonCategories: () => batchLoadReferenceData().then(r => r.data?.categories || []),
        });

        // Warm interaction cache
        await warmInteractionCache(queryClient, userContext, fetchOptimizedInteractions);
      } catch (error) {
        console.warn('Cache warming failed:', error);
      }
    };

    // Warm cache after a short delay to not block initial render
    const timeoutId = setTimeout(warmCache, 100);
    return () => clearTimeout(timeoutId);
  }, [userContext, queryClient]);

  return { userContext };
}

// ============================================================================
// CACHE INVALIDATION UTILITIES
// ============================================================================

/**
 * Hook for managing cache invalidation
 */
export function useCacheInvalidation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userContext = user
    ? {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role as 'ADMIN' | 'COUNSELOR',
      }
    : null;

  const invalidateInteractions = React.useCallback(() => {
    if (!userContext) return;
    invalidateUserCache(queryClient, userContext);
  }, [queryClient, userContext]);

  const invalidateReferenceData = React.useCallback(() => {
    if (!userContext) return;
    queryClient.invalidateQueries({
      queryKey: ['referenceData', 'batch', userContext.tenantId],
    });
  }, [queryClient, userContext]);

  return {
    invalidateInteractions,
    invalidateReferenceData,
  };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Hook for monitoring query performance
 */
export function useQueryPerformance() {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = React.useState<{
    totalQueries: number;
    staleQueries: number;
    errorQueries: number;
    cacheHitRate: number;
  } | null>(null);

  React.useEffect(() => {
    const updateMetrics = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      const totalQueries = queries.length;
      const staleQueries = queries.filter(q => q.isStale()).length;
      const errorQueries = queries.filter(q => q.state.status === 'error').length;
      const successQueries = queries.filter(q => q.state.status === 'success').length;
      const cacheHitRate = totalQueries > 0 ? (successQueries / totalQueries) * 100 : 0;

      setMetrics({
        totalQueries,
        staleQueries,
        errorQueries,
        cacheHitRate: Math.round(cacheHitRate),
      });
    };

    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [queryClient]);

  return metrics;
}

export default useOptimizedInteractions;
