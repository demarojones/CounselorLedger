# Performance Optimization Guide

This document outlines the comprehensive performance optimizations implemented for privacy-filtered queries in the School Counselor Ledger application.

## Overview

The performance optimization implementation addresses the following key areas:

1. **Database Query Optimization** - Composite indexes for counselor filtering
2. **API Response Time Optimization** - Selective field loading and query optimization
3. **UI Component Efficiency** - Virtualization and memoization
4. **Privacy-Aware Caching** - Caching strategies that respect counselor boundaries

## Database Optimizations

### Composite Indexes

New composite indexes have been added to optimize the most common query patterns:

```sql
-- Counselor-specific interaction queries (most common)
CREATE INDEX idx_interactions_counselor_time 
  ON interactions(tenant_id, counselor_id, start_time DESC);

-- Admin aggregated queries
CREATE INDEX idx_interactions_tenant_time 
  ON interactions(tenant_id, start_time DESC);

-- Student interaction history (counselor-filtered)
CREATE INDEX idx_interactions_counselor_student 
  ON interactions(tenant_id, counselor_id, student_id, regarding_student_id);

-- Contact interaction history (counselor-filtered)
CREATE INDEX idx_interactions_counselor_contact 
  ON interactions(tenant_id, counselor_id, contact_id);

-- Follow-up queries (counselor-filtered)
CREATE INDEX idx_interactions_counselor_followup 
  ON interactions(tenant_id, counselor_id, needs_follow_up, is_follow_up_complete, follow_up_date)
  WHERE needs_follow_up = TRUE AND is_follow_up_complete = FALSE;
```

### Query Pattern Optimization

The indexes are designed to support these common query patterns:

1. **Counselor Dashboard**: `tenant_id + counselor_id + start_time DESC`
2. **Admin Reports**: `tenant_id + start_time DESC`
3. **Student History**: `tenant_id + counselor_id + student_id`
4. **Contact History**: `tenant_id + counselor_id + contact_id`
5. **Follow-ups**: `tenant_id + counselor_id + follow_up_status`

## API Optimizations

### Selective Field Loading

The optimized API implements selective field loading to reduce payload size:

```typescript
// Minimal fields for list views (reduces payload by ~60%)
const INTERACTION_LIST_FIELDS = `
  id, counselor_id, student_id, contact_id, regarding_student_id,
  category_id, subcategory_id, custom_reason, start_time, 
  duration_minutes, end_time, needs_follow_up, follow_up_date,
  is_follow_up_complete, created_at
`;

// Full fields for detail views
const INTERACTION_DETAIL_FIELDS = `
  ${INTERACTION_LIST_FIELDS}, notes, follow_up_notes, 
  follow_up_completed_at, updated_at
`;
```

### Batch Operations

Reference data is loaded in parallel to reduce API calls:

```typescript
// Execute all queries in parallel for better performance
const [studentsResult, contactsResult, categoriesResult] = await Promise.all([
  fetchStudentsMinimal(),
  fetchContactsMinimal(),
  fetchReasonCategories(),
]);
```

### Query Optimization

Queries are optimized to utilize the composite indexes:

```typescript
// Optimized query using idx_interactions_counselor_time index
let query = supabase
  .from('interactions')
  .select(fields)
  .eq('tenant_id', context.tenantId);

// Apply counselor filtering (utilizes composite index)
if (context.userRole === 'COUNSELOR') {
  query = query.eq('counselor_id', context.userId);
}

// Apply filters in order of selectivity
if (studentId) {
  query = query.or(`student_id.eq.${studentId},regarding_student_id.eq.${studentId}`);
}
```

## Caching Optimizations

### Privacy-Aware Cache Keys

Cache keys include user context to prevent cross-counselor data leakage:

```typescript
// Counselor-scoped cache keys
['interactions', 'counselor', 'counselor-1', 'tenant', 'tenant-1']

// Admin-scoped cache keys  
['interactions', 'admin', 'tenant-1']

// Shared data cache keys
['students', 'tenant', 'tenant-1']
```

### Dynamic Cache Configuration

Cache settings are optimized based on data sensitivity:

```typescript
// Interaction data (privacy-sensitive) - shorter stale time
if (keyString.includes('interactions')) {
  return userContext?.role === 'COUNSELOR' 
    ? 2 * 60 * 1000  // 2 minutes for counselor data
    : 5 * 60 * 1000; // 5 minutes for admin data
}

// Reference data (shared) - longer stale time
if (keyString.includes('students') || keyString.includes('contacts')) {
  return 10 * 60 * 1000; // 10 minutes
}
```

### Cache Invalidation Strategies

Automatic cache invalidation based on user context changes:

```typescript
// Invalidate user-specific cache on context change
export function invalidateUserCache(queryClient, userContext) {
  queryClient.invalidateQueries({
    queryKey: privacyAwareQueryKeys.interactions(userContext),
  });
  
  queryClient.invalidateQueries({
    queryKey: privacyAwareQueryKeys.dashboardStats(userContext),
  });
}
```

## UI Component Optimizations

### Virtual Scrolling

Large interaction lists use virtual scrolling to handle thousands of records:

```typescript
import { FixedSizeList as List } from 'react-window';

// Virtualized list for large datasets
<List
  height={maxHeight}
  itemCount={filteredInteractions.length}
  itemSize={60} // Approximate row height
  itemData={virtualizedData}
>
  {VirtualizedInteractionItem}
</List>
```

### Memoization

Components are memoized to prevent unnecessary re-renders:

```typescript
// Memoized interaction row component
const InteractionRow = React.memo<InteractionRowProps>(({ interaction, onView, onEdit }) => {
  // Component implementation
});

// Memoized filtering and sorting
const filteredInteractions = useMemo(() => {
  // Filtering logic
}, [interactions, filters]);
```

### Efficient Data Loading

Components use optimized hooks with pagination and selective loading:

```typescript
// Infinite scroll for large datasets
const {
  data: infiniteData,
  fetchNextPage,
  hasNextPage,
} = useInfiniteInteractions(queryOptions);

// Regular query for smaller datasets
const {
  data: regularData,
} = useOptimizedInteractions({
  limit: 50,
  includeNotes: false, // Use minimal fields
});
```

## Performance Monitoring

### Query Performance Tracking

All queries are monitored for performance metrics:

```typescript
performanceMonitor.recordQuery(
  queryKey,
  executionTime,
  cacheHit,
  dataSize,
  userContext
);
```

### Cache Metrics

Cache performance is continuously monitored:

```typescript
const metrics = {
  totalQueries: queries.length,
  cacheHits: queries.filter(q => q.cacheHit).length,
  hitRate: (cacheHits / totalQueries) * 100,
  averageQueryTime: totalTime / totalQueries,
  privacyCompliantQueries: compliantQueries.length,
};
```

### Performance Recommendations

The system generates automatic performance recommendations:

```typescript
// Low cache hit rate
if (cacheMetrics.hitRate < 70) {
  recommendations.push(
    `Low cache hit rate (${cacheMetrics.hitRate}%). Consider increasing stale time.`
  );
}

// Slow queries
if (slowQueries.length > 0) {
  recommendations.push(
    `${slowQueries.length} slow queries detected. Consider optimizing indexes.`
  );
}
```

## Implementation Files

### Database
- `supabase/migrations/023_performance_indexes.sql` - Composite indexes for optimization

### API Layer
- `src/services/optimizedApi.ts` - Optimized API with selective field loading
- `src/hooks/useOptimizedInteractions.ts` - Performance-optimized React hooks

### Caching
- `src/utils/privacyAwareCache.ts` - Privacy-aware caching utilities
- `src/lib/optimizedQueryClient.ts` - Enhanced query client configuration

### UI Components
- `src/components/interactions/OptimizedInteractionList.tsx` - Virtualized interaction list
- `src/components/dashboard/OptimizedDashboardStats.tsx` - Optimized dashboard

### Monitoring
- `src/utils/performanceMonitor.ts` - Performance monitoring utilities
- `src/utils/__tests__/performance-optimization.test.ts` - Comprehensive test suite

## Performance Metrics

### Expected Improvements

1. **Database Query Performance**: 60-80% reduction in query time for counselor-filtered queries
2. **API Response Size**: 40-60% reduction in payload size with selective field loading
3. **Cache Hit Rate**: 70-90% cache hit rate for frequently accessed data
4. **UI Rendering**: 50-70% improvement in large list rendering performance
5. **Memory Usage**: 30-50% reduction in client-side memory usage

### Monitoring Thresholds

- **Slow Query Threshold**: 1000ms (1 second)
- **Cache Hit Rate Target**: >70%
- **Average Query Time Target**: <500ms
- **UI Render Time Target**: <100ms for list updates

## Privacy Compliance

All optimizations maintain strict privacy boundaries:

1. **Cache Isolation**: Counselor data is never shared between users
2. **Query Scoping**: All queries include proper user/tenant filtering
3. **Access Validation**: Privacy violations are detected and logged
4. **Audit Logging**: All data access is logged without exposing content

## Usage Guidelines

### For Developers

1. **Use Optimized Hooks**: Always use `useOptimizedInteractions` instead of the basic hook
2. **Enable Virtualization**: Use `enableVirtualization={true}` for lists >20 items
3. **Selective Field Loading**: Set `includeNotes={false}` for list views
4. **Monitor Performance**: Check performance metrics in development mode

### For Administrators

1. **Database Maintenance**: Run `ANALYZE` on tables after significant data changes
2. **Index Monitoring**: Monitor index usage with the `performance_stats` view
3. **Cache Optimization**: Review cache hit rates and adjust stale times as needed
4. **Performance Alerts**: Set up monitoring for slow queries and low cache hit rates

## Troubleshooting

### Common Issues

1. **Low Cache Hit Rate**: Increase stale time for stable data
2. **Slow Queries**: Check if proper indexes are being used
3. **High Memory Usage**: Enable virtualization for large lists
4. **Privacy Violations**: Ensure all queries use privacy-aware cache keys

### Debug Tools

```typescript
// Log performance report in development
import { logPerformanceReport } from '@/utils/performanceMonitor';
logPerformanceReport();

// Validate cache privacy compliance
import { validateCachePrivacy } from '@/utils/privacyAwareCache';
const validation = validateCachePrivacy(queryClient, userContext);
console.log('Privacy compliance:', validation);
```

## Future Optimizations

1. **Server-Side Caching**: Implement Redis caching for frequently accessed data
2. **CDN Integration**: Cache static reference data at the edge
3. **Background Sync**: Implement background data synchronization
4. **Predictive Prefetching**: Prefetch likely-to-be-accessed data
5. **Query Batching**: Batch multiple queries into single requests