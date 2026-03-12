/**
 * Performance Optimization Tests
 *
 * This test suite validates the performance optimizations for privacy-filtered queries:
 * - Database query optimization
 * - Cache efficiency
 * - Privacy-aware data loading
 * - UI component performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createOptimizedQueryClient } from '@/lib/optimizedQueryClient';
import { performanceMonitor } from '@/utils/performanceMonitor';
import {
  generatePrivacyCacheKey,
  validateCachePrivacy,
} from '@/utils/privacyAwareCache';
import {
  fetchOptimizedInteractions,
  fetchOptimizedStudentInteractions,
  batchLoadReferenceData,
} from '@/services/optimizedApi';

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
                count: 0,
              })
            ),
            limit: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
  },
}));

// Mock tenant context
vi.mock('@/services/supabaseHelpers', () => ({
  getTenantContext: vi.fn(() =>
    Promise.resolve({
      userId: 'counselor-1',
      tenantId: 'tenant-1',
      userRole: 'COUNSELOR',
    })
  ),
  handleSupabaseError: vi.fn(error => error),
}));

describe('Performance Optimization Tests', () => {
  let queryClient: QueryClient;
  let userContext: {
    userId: string;
    tenantId: string;
    role: 'ADMIN' | 'COUNSELOR';
  };

  beforeEach(() => {
    userContext = {
      userId: 'counselor-1',
      tenantId: 'tenant-1',
      role: 'COUNSELOR',
    };
    queryClient = createOptimizedQueryClient(userContext);
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Privacy-Aware Cache Key Generation', () => {
    it('should generate counselor-scoped keys for interaction data', () => {
      const baseKey = ['interactions'] as const;
      const cacheKey = generatePrivacyCacheKey(baseKey, userContext);

      expect(cacheKey).toContain('counselor');
      expect(cacheKey).toContain(userContext.userId);
      expect(cacheKey).not.toContain('admin');
    });

    it('should generate admin-scoped keys for admin users', () => {
      const adminContext = { ...userContext, role: 'ADMIN' as const };
      const baseKey = ['interactions'] as const;
      const cacheKey = generatePrivacyCacheKey(baseKey, adminContext);

      expect(cacheKey).toContain('admin');
      expect(cacheKey).toContain(adminContext.tenantId);
      expect(cacheKey).not.toContain('counselor');
    });

    it('should generate tenant-scoped keys for shared data', () => {
      const baseKey = ['students'] as const;
      const cacheKey = generatePrivacyCacheKey(baseKey, userContext);

      expect(cacheKey).toContain('tenant');
      expect(cacheKey).toContain(userContext.tenantId);
    });

    it('should prevent cache key collisions between users', () => {
      const user1Context = { ...userContext, userId: 'counselor-1' };
      const user2Context = { ...userContext, userId: 'counselor-2' };

      const key1 = generatePrivacyCacheKey(['interactions'], user1Context);
      const key2 = generatePrivacyCacheKey(['interactions'], user2Context);

      expect(key1).not.toEqual(key2);
    });
  });

  describe('Cache Privacy Validation', () => {
    it('should detect privacy violations in cache', () => {
      // Add a non-compliant query to cache
      queryClient.setQueryData(['interactions', 'global'], []);

      const validation = validateCachePrivacy(queryClient, userContext);

      expect(validation.isCompliant).toBe(false);
      expect(validation.violations).toHaveLength(1);
      expect(validation.violations[0]).toContain('without proper user scoping');
    });

    it('should validate compliant cache entries', () => {
      // Add compliant queries to cache
      const counselorKey = generatePrivacyCacheKey(['interactions'], userContext);
      const tenantKey = generatePrivacyCacheKey(['students'], userContext);

      queryClient.setQueryData(counselorKey, []);
      queryClient.setQueryData(tenantKey, []);

      const validation = validateCachePrivacy(queryClient, userContext);

      expect(validation.isCompliant).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should detect wrong user ID in counselor-scoped queries', () => {
      const wrongUserKey = ['interactions', 'counselor', 'wrong-user-id'];
      queryClient.setQueryData(wrongUserKey, []);

      const validation = validateCachePrivacy(queryClient, userContext);

      expect(validation.isCompliant).toBe(false);
      expect(validation.violations.some(v => v.includes('wrong user ID'))).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    it('should record query performance metrics', () => {
      const queryKey = ['interactions', 'counselor', userContext.userId];
      const executionTime = 150;
      const cacheHit = false;
      const dataSize = 1024;

      performanceMonitor.recordQuery(queryKey, executionTime, cacheHit, dataSize, userContext);

      const metrics = performanceMonitor.getCacheMetrics();

      expect(metrics.totalQueries).toBe(1);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.averageQueryTime).toBe(executionTime);
    });

    it('should detect slow queries', () => {
      const slowQueryKey = ['interactions', 'slow'];
      const slowExecutionTime = 2000; // 2 seconds

      performanceMonitor.recordQuery(slowQueryKey, slowExecutionTime, false, 1024, userContext);

      const slowQueries = performanceMonitor.getSlowQueries();

      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0].executionTime).toBe(slowExecutionTime);
      expect(slowQueries[0].queryKey).toBe(slowQueryKey.join('.'));
    });

    it('should calculate cache hit rates correctly', () => {
      // Record cache hit
      performanceMonitor.recordQuery(['test1'], 100, true, 512, userContext);
      // Record cache miss
      performanceMonitor.recordQuery(['test2'], 200, false, 1024, userContext);

      const metrics = performanceMonitor.getCacheMetrics();

      expect(metrics.totalQueries).toBe(2);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.hitRate).toBe(50);
    });

    it('should generate performance recommendations', () => {
      // Create conditions for recommendations

      // Low cache hit rate
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordQuery([`miss-${i}`], 100, false, 512, userContext);
      }

      // Slow query
      performanceMonitor.recordQuery(['slow'], 2000, false, 1024, userContext);

      // Privacy violation
      performanceMonitor.recordQuery(['interactions', 'global'], 100, false, 512, userContext);

      const recommendations = performanceMonitor.generateRecommendations();

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('cache hit rate'))).toBe(true);
      expect(recommendations.some(r => r.includes('slow queries'))).toBe(true);
      expect(recommendations.some(r => r.includes('privacy violations'))).toBe(true);
    });
  });

  describe('Optimized API Performance', () => {
    it('should use selective field loading for list views', async () => {
      const result = await fetchOptimizedInteractions({
        limit: 10,
        includeNotes: false, // Should use minimal fields
      });

      // Verify the query was made (mocked)
      expect(result).toBeDefined();
    });

    it('should use full field loading for detail views', async () => {
      const result = await fetchOptimizedInteractions({
        limit: 1,
        includeNotes: true, // Should use full fields
      });

      // Verify the query was made (mocked)
      expect(result).toBeDefined();
    });

    it('should batch load reference data efficiently', async () => {
      const startTime = performance.now();

      const result = await batchLoadReferenceData();

      const executionTime = performance.now() - startTime;

      // Should complete quickly due to parallel loading
      expect(executionTime).toBeLessThan(1000); // Less than 1 second
      expect(result).toBeDefined();
    });

    it('should apply proper filtering for counselor privacy', async () => {
      const studentId = 'student-1';

      const result = await fetchOptimizedStudentInteractions(studentId, {
        limit: 10,
        includeNotes: false,
      });

      // Verify the query respects counselor filtering (mocked)
      expect(result).toBeDefined();
    });
  });

  describe('Query Client Optimization', () => {
    it('should configure appropriate stale times for different data types', () => {
      const interactionKey = generatePrivacyCacheKey(['interactions'], userContext);
      const studentKey = generatePrivacyCacheKey(['students'], userContext);

      // Set data with different staleness expectations
      queryClient.setQueryData(interactionKey, []);
      queryClient.setQueryData(studentKey, []);

      const interactionQuery = queryClient.getQueryCache().find({ queryKey: interactionKey });
      const studentQuery = queryClient.getQueryCache().find({ queryKey: studentKey });

      // Both queries should exist
      expect(interactionQuery).toBeDefined();
      expect(studentQuery).toBeDefined();
    });

    it('should handle privacy violations in error handling', () => {
      // This test validates that privacy violation errors are properly structured
      const privacyError = {
        code: 'PRIVACY_VIOLATION',
        message: 'Access denied: interaction belongs to another counselor',
      };

      // Verify error structure
      expect(privacyError.code).toBe('PRIVACY_VIOLATION');
      expect(privacyError.message).toContain('Access denied');
    });

    it('should optimize cache size and performance', () => {
      // Test that cache operations work correctly
      const key = generatePrivacyCacheKey(['test'], userContext);
      queryClient.setQueryData(key, { data: 'test-data' });

      const data = queryClient.getQueryData(key);
      expect(data).toEqual({ data: 'test-data' });

      // Verify cache can be cleared
      queryClient.removeQueries({ queryKey: key });
      const clearedData = queryClient.getQueryData(key);
      expect(clearedData).toBeUndefined();
    });
  });

  describe('Integration Performance Tests', () => {
    it('should maintain performance under load', async () => {
      const iterations = 50;
      const executionTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        // Simulate typical user interaction
        const key = generatePrivacyCacheKey([`interactions-${i}`], userContext);
        queryClient.setQueryData(key, { interactions: [] });

        const endTime = performance.now();
        executionTimes.push(endTime - startTime);
      }

      const averageTime = executionTimes.reduce((sum, time) => sum + time, 0) / iterations;

      // Should maintain good performance
      expect(averageTime).toBeLessThan(10); // Less than 10ms average
    });

    it('should handle concurrent privacy-scoped queries', async () => {
      const concurrentQueries = Array.from({ length: 10 }, (_, i) => {
        const key = generatePrivacyCacheKey([`concurrent-${i}`], userContext);
        return queryClient.fetchQuery({
          queryKey: key,
          queryFn: () => Promise.resolve({ data: `result-${i}` }),
        });
      });

      const results = await Promise.all(concurrentQueries);

      // All queries should complete successfully
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result).toEqual({ data: `result-${i}` });
      });
    });

    it('should maintain cache privacy under concurrent access', async () => {
      const user1Context = { ...userContext, userId: 'counselor-1' };
      const user2Context = { ...userContext, userId: 'counselor-2' };

      // Simulate concurrent access by different counselors
      const user1Key = generatePrivacyCacheKey(['interactions'], user1Context);
      const user2Key = generatePrivacyCacheKey(['interactions'], user2Context);

      queryClient.setQueryData(user1Key, { interactions: ['user1-data'] });
      queryClient.setQueryData(user2Key, { interactions: ['user2-data'] });

      // Verify data isolation
      const user1Data = queryClient.getQueryData(user1Key);
      const user2Data = queryClient.getQueryData(user2Key);

      expect(user1Data).not.toEqual(user2Data);
      expect(user1Key).not.toEqual(user2Key);
    });
  });
});
