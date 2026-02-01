-- Performance Optimization Indexes for Counselor Privacy Filtering
-- This migration adds composite indexes to optimize privacy-filtered queries

-- ============================================================================
-- INTERACTIONS TABLE PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for counselor-specific interaction queries (most common query pattern)
-- Optimizes: SELECT * FROM interactions WHERE tenant_id = ? AND counselor_id = ? ORDER BY start_time DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interactions_counselor_time 
  ON interactions(tenant_id, counselor_id, start_time DESC);

-- Composite index for admin aggregated queries
-- Optimizes: SELECT * FROM interactions WHERE tenant_id = ? ORDER BY start_time DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interactions_tenant_time 
  ON interactions(tenant_id, start_time DESC);

-- Composite index for student interaction history (counselor-filtered)
-- Optimizes: SELECT * FROM interactions WHERE tenant_id = ? AND counselor_id = ? AND (student_id = ? OR regarding_student_id = ?)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interactions_counselor_student 
  ON interactions(tenant_id, counselor_id, student_id, regarding_student_id);

-- Composite index for contact interaction history (counselor-filtered)
-- Optimizes: SELECT * FROM interactions WHERE tenant_id = ? AND counselor_id = ? AND contact_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interactions_counselor_contact 
  ON interactions(tenant_id, counselor_id, contact_id);

-- Composite index for follow-up queries (counselor-filtered)
-- Optimizes: SELECT * FROM interactions WHERE tenant_id = ? AND counselor_id = ? AND needs_follow_up = TRUE AND is_follow_up_complete = FALSE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interactions_counselor_followup 
  ON interactions(tenant_id, counselor_id, needs_follow_up, is_follow_up_complete, follow_up_date)
  WHERE needs_follow_up = TRUE AND is_follow_up_complete = FALSE;

-- Composite index for category-based filtering (counselor-filtered)
-- Optimizes: SELECT * FROM interactions WHERE tenant_id = ? AND counselor_id = ? AND category_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interactions_counselor_category 
  ON interactions(tenant_id, counselor_id, category_id, start_time DESC);

-- Composite index for date range queries (counselor-filtered)
-- Optimizes: SELECT * FROM interactions WHERE tenant_id = ? AND counselor_id = ? AND start_time BETWEEN ? AND ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interactions_counselor_daterange 
  ON interactions(tenant_id, counselor_id, start_time);

-- ============================================================================
-- STUDENTS TABLE PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for student search within tenant
-- Optimizes: SELECT * FROM students WHERE tenant_id = ? AND (first_name ILIKE ? OR last_name ILIKE ?)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_tenant_search 
  ON students(tenant_id, first_name, last_name);

-- Composite index for student follow-up queries
-- Optimizes: SELECT * FROM students WHERE tenant_id = ? AND needs_follow_up = TRUE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_tenant_followup 
  ON students(tenant_id, needs_follow_up)
  WHERE needs_follow_up = TRUE;

-- ============================================================================
-- CONTACTS TABLE PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for contact search within tenant
-- Optimizes: SELECT * FROM contacts WHERE tenant_id = ? AND (first_name ILIKE ? OR last_name ILIKE ?)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_tenant_search 
  ON contacts(tenant_id, first_name, last_name);

-- ============================================================================
-- USERS TABLE PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for user role queries within tenant
-- Optimizes: SELECT * FROM users WHERE tenant_id = ? AND role = ? AND is_active = TRUE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_role_active 
  ON users(tenant_id, role, is_active)
  WHERE is_active = TRUE;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View to monitor index usage and query performance
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- View to monitor slow queries related to interactions
CREATE OR REPLACE VIEW slow_interaction_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%interactions%'
  AND mean_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_interactions_counselor_time IS 
  'Optimizes counselor-specific interaction queries ordered by time';

COMMENT ON INDEX idx_interactions_tenant_time IS 
  'Optimizes admin aggregated interaction queries ordered by time';

COMMENT ON INDEX idx_interactions_counselor_student IS 
  'Optimizes student interaction history queries with counselor filtering';

COMMENT ON INDEX idx_interactions_counselor_contact IS 
  'Optimizes contact interaction history queries with counselor filtering';

COMMENT ON INDEX idx_interactions_counselor_followup IS 
  'Optimizes follow-up queries with counselor filtering';

COMMENT ON INDEX idx_interactions_counselor_category IS 
  'Optimizes category-based filtering with counselor privacy';

COMMENT ON INDEX idx_interactions_counselor_daterange IS 
  'Optimizes date range queries with counselor filtering';

COMMENT ON VIEW performance_stats IS 
  'Monitors index usage and performance for optimization';

COMMENT ON VIEW slow_interaction_queries IS 
  'Identifies slow interaction-related queries for optimization';