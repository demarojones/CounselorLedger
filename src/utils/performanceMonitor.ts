/**
 * Performance Monitoring Utilities
 *
 * This module provides tools for monitoring and optimizing application performance:
 * - Query performance tracking
 * - Cache hit rate monitoring
 * - Privacy-aware performance metrics
 * - Performance bottleneck detection
 */

import { QueryClient } from '@tanstack/react-query';

// ============================================================================
// PERFORMANCE METRICS INTERFACES
// ============================================================================

interface QueryPerformanceMetric {
  queryKey: string;
  executionTime: number;
  cacheHit: boolean;
  dataSize: number;
  timestamp: number;
  userRole: 'ADMIN' | 'COUNSELOR';
  privacyScope: 'counselor' | 'tenant' | 'global';
}

interface CacheMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageQueryTime: number;
  privacyCompliantQueries: number;
  privacyViolations: number;
}

interface PerformanceReport {
  cacheMetrics: CacheMetrics;
  slowQueries: QueryPerformanceMetric[];
  privacyMetrics: {
    counselorScopedQueries: number;
    tenantScopedQueries: number;
    globalQueries: number;
    violations: string[];
  };
  recommendations: string[];
}

// ============================================================================
// PERFORMANCE TRACKING CLASS
// ============================================================================

class PerformanceMonitor {
  private metrics: QueryPerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private slowQueryThreshold = 1000; // 1 second

  /**
   * Record a query performance metric
   */
  recordQuery(
    queryKey: readonly unknown[],
    executionTime: number,
    cacheHit: boolean,
    dataSize: number,
    userContext?: {
      role: 'ADMIN' | 'COUNSELOR';
      userId: string;
      tenantId: string;
    }
  ): void {
    const metric: QueryPerformanceMetric = {
      queryKey: queryKey.join('.'),
      executionTime,
      cacheHit,
      dataSize,
      timestamp: Date.now(),
      userRole: userContext?.role || 'COUNSELOR',
      privacyScope: this.determinePrivacyScope(queryKey),
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow queries in development
    if (import.meta.env.DEV && executionTime > this.slowQueryThreshold) {
      console.warn(`Slow query detected: ${metric.queryKey} (${executionTime}ms)`);
    }
  }

  /**
   * Determine privacy scope from query key
   */
  private determinePrivacyScope(queryKey: readonly unknown[]): 'counselor' | 'tenant' | 'global' {
    const keyString = queryKey.join('.');

    if (keyString.includes('counselor')) {
      return 'counselor';
    }
    if (keyString.includes('tenant')) {
      return 'tenant';
    }
    return 'global';
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    const totalQueries = this.metrics.length;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const cacheMisses = totalQueries - cacheHits;
    const hitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;

    const totalTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0);
    const averageQueryTime = totalQueries > 0 ? totalTime / totalQueries : 0;

    const privacyCompliantQueries = this.metrics.filter(
      m => m.privacyScope === 'counselor' || m.privacyScope === 'tenant'
    ).length;

    const privacyViolations = this.metrics.filter(
      m => m.privacyScope === 'global' && m.queryKey.includes('interactions')
    ).length;

    return {
      totalQueries,
      cacheHits,
      cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      privacyCompliantQueries,
      privacyViolations,
    };
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit = 10): QueryPerformanceMetric[] {
    return this.metrics
      .filter(m => m.executionTime > this.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  /**
   * Get privacy metrics
   */
  getPrivacyMetrics(): PerformanceReport['privacyMetrics'] {
    const counselorScopedQueries = this.metrics.filter(m => m.privacyScope === 'counselor').length;
    const tenantScopedQueries = this.metrics.filter(m => m.privacyScope === 'tenant').length;
    const globalQueries = this.metrics.filter(m => m.privacyScope === 'global').length;

    const violations: string[] = [];

    // Check for interaction queries without proper scoping
    this.metrics.forEach(metric => {
      if (metric.queryKey.includes('interactions') && metric.privacyScope === 'global') {
        violations.push(`Unscoped interaction query: ${metric.queryKey}`);
      }
    });

    return {
      counselorScopedQueries,
      tenantScopedQueries,
      globalQueries,
      violations: [...new Set(violations)], // Remove duplicates
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const cacheMetrics = this.getCacheMetrics();
    const slowQueries = this.getSlowQueries();
    const privacyMetrics = this.getPrivacyMetrics();

    // Cache hit rate recommendations
    if (cacheMetrics.hitRate < 70) {
      recommendations.push(
        `Low cache hit rate (${cacheMetrics.hitRate}%). Consider increasing stale time for stable data.`
      );
    }

    // Slow query recommendations
    if (slowQueries.length > 0) {
      recommendations.push(
        `${slowQueries.length} slow queries detected. Consider optimizing database indexes or reducing data payload.`
      );
    }

    // Privacy recommendations
    if (privacyMetrics.violations.length > 0) {
      recommendations.push(
        `${privacyMetrics.violations.length} privacy violations detected. Ensure all interaction queries use proper user scoping.`
      );
    }

    // Average query time recommendations
    if (cacheMetrics.averageQueryTime > 500) {
      recommendations.push(
        `High average query time (${cacheMetrics.averageQueryTime}ms). Consider implementing pagination or selective field loading.`
      );
    }

    return recommendations;
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): PerformanceReport {
    return {
      cacheMetrics: this.getCacheMetrics(),
      slowQueries: this.getSlowQueries(),
      privacyMetrics: this.getPrivacyMetrics(),
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): QueryPerformanceMetric[] {
    return [...this.metrics];
  }
}

// ============================================================================
// GLOBAL PERFORMANCE MONITOR INSTANCE
// ============================================================================

export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// QUERY CLIENT INTEGRATION
// ============================================================================

/**
 * Enhance query client with performance monitoring
 */
export function enhanceQueryClientWithMonitoring(
  queryClient: QueryClient,
  userContext?: {
    role: 'ADMIN' | 'COUNSELOR';
    userId: string;
    tenantId: string;
  }
): QueryClient {
  // Wrap the original query function to add performance tracking
  const originalQuery = queryClient.fetchQuery.bind(queryClient);

  // @ts-expect-error — we intentionally widen the signature for monitoring purposes
  queryClient.fetchQuery = async (options: any) => {
    const startTime = performance.now();
    let cacheHit = false;
    let dataSize = 0;

    try {
      // Check if data is already in cache
      const existingData = queryClient.getQueryData(options.queryKey);
      cacheHit = !!existingData;

      const result = await originalQuery(options);

      // Calculate data size (approximate)
      if (result) {
        dataSize = JSON.stringify(result).length;
      }

      const executionTime = performance.now() - startTime;

      // Record performance metric
      performanceMonitor.recordQuery(
        options.queryKey,
        executionTime,
        cacheHit,
        dataSize,
        userContext
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;

      // Record failed query
      performanceMonitor.recordQuery(options.queryKey, executionTime, cacheHit, 0, userContext);

      throw error;
    }
  };

  return queryClient;
}

// ============================================================================
// REACT HOOKS FOR PERFORMANCE MONITORING
// ============================================================================

/**
 * Hook for accessing performance metrics in components
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = React.useState<PerformanceReport | null>(null);

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.generateReport());
    };

    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

/**
 * Hook for monitoring specific query performance
 */
export function useQueryPerformanceTracker(queryKey: readonly unknown[]) {
  const [queryMetrics, setQueryMetrics] = React.useState<{
    averageTime: number;
    cacheHitRate: number;
    lastExecutionTime: number;
  } | null>(null);

  React.useEffect(() => {
    const updateQueryMetrics = () => {
      const allMetrics = performanceMonitor.exportMetrics();
      const keyString = queryKey.join('.');
      const querySpecificMetrics = allMetrics.filter(m => m.queryKey === keyString);

      if (querySpecificMetrics.length > 0) {
        const totalTime = querySpecificMetrics.reduce((sum, m) => sum + m.executionTime, 0);
        const averageTime = totalTime / querySpecificMetrics.length;
        const cacheHits = querySpecificMetrics.filter(m => m.cacheHit).length;
        const cacheHitRate = (cacheHits / querySpecificMetrics.length) * 100;
        const lastExecutionTime =
          querySpecificMetrics[querySpecificMetrics.length - 1].executionTime;

        setQueryMetrics({
          averageTime: Math.round(averageTime * 100) / 100,
          cacheHitRate: Math.round(cacheHitRate * 100) / 100,
          lastExecutionTime,
        });
      }
    };

    const interval = setInterval(updateQueryMetrics, 10000);
    updateQueryMetrics();

    return () => clearInterval(interval);
  }, [queryKey]);

  return queryMetrics;
}

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

/**
 * Log performance report to console (development only)
 */
export function logPerformanceReport(): void {
  if (!import.meta.env.DEV) return;

  const report = performanceMonitor.generateReport();

  console.group('🚀 Performance Report');
  console.log('Cache Metrics:', report.cacheMetrics);
  console.log('Slow Queries:', report.slowQueries);
  console.log('Privacy Metrics:', report.privacyMetrics);
  console.log('Recommendations:', report.recommendations);
  console.groupEnd();
}

/**
 * Export performance data for analysis
 */
export function exportPerformanceData(): string {
  const report = performanceMonitor.generateReport();
  return JSON.stringify(report, null, 2);
}

// Add React import for hooks
import React from 'react';
