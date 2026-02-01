-- Performance Optimization Migration
-- This migration adds comprehensive indexes, materialized views, and maintenance functions

-- ============================================================================
-- PERFORMANCE INDEXES FOR INTERACTIONS
-- ============================================================================

-- Composite index for counselor-specific interaction queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_interactions_counselor_time 
  ON interactions(tenant_id, counselor_id, start_time DESC);

-- Composite index for admin aggregated queries
CREATE INDEX IF NOT EXISTS idx_interactions_tenant_time 
  ON interactions(tenant_id, start_time DESC);

-- Composite index for student interaction history (counselor-filtered)
CREATE INDEX IF NOT EXISTS idx_interactions_counselor_student 
  ON interactions(tenant_id, counselor_id, student_id, regarding_student_id);

-- Composite index for contact interaction history (counselor-filtered)
CREATE INDEX IF NOT EXISTS idx_interactions_counselor_contact 
  ON interactions(tenant_id, counselor_id, contact_id);

-- Composite index for follow-up queries (counselor-filtered)
CREATE INDEX IF NOT EXISTS idx_interactions_counselor_followup 
  ON interactions(tenant_id, counselor_id, needs_follow_up, is_follow_up_complete, follow_up_date)
  WHERE needs_follow_up = TRUE AND is_follow_up_complete = FALSE;

-- Composite index for category-based filtering (counselor-filtered)
CREATE INDEX IF NOT EXISTS idx_interactions_counselor_category 
  ON interactions(tenant_id, counselor_id, category_id, start_time DESC);

-- Composite index for date range queries (counselor-filtered)
CREATE INDEX IF NOT EXISTS idx_interactions_counselor_daterange 
  ON interactions(tenant_id, counselor_id, start_time);

-- ============================================================================
-- PERFORMANCE INDEXES FOR STUDENTS
-- ============================================================================

-- Composite index for student search within tenant
CREATE INDEX IF NOT EXISTS idx_students_tenant_search 
  ON students(tenant_id, first_name, last_name);

-- Composite index for student follow-up queries
CREATE INDEX IF NOT EXISTS idx_students_tenant_followup 
  ON students(tenant_id, needs_follow_up)
  WHERE needs_follow_up = TRUE;

-- ============================================================================
-- PERFORMANCE INDEXES FOR CONTACTS
-- ============================================================================

-- Composite index for contact search within tenant
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_search 
  ON contacts(tenant_id, first_name, last_name);

-- ============================================================================
-- PERFORMANCE INDEXES FOR USERS
-- ============================================================================

-- Composite index for user role queries within tenant
CREATE INDEX IF NOT EXISTS idx_users_tenant_role_active 
  ON users(tenant_id, role, is_active)
  WHERE is_active = TRUE;

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- Materialized view for tenant statistics (refresh daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS tenant_statistics AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.subdomain,
  COUNT(DISTINCT s.id) as student_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = true) as active_user_count,
  COUNT(DISTINCT i.id) as total_interactions,
  COUNT(DISTINCT CASE WHEN i.start_time >= CURRENT_DATE - INTERVAL '30 days' THEN i.id END) as recent_interactions,
  COUNT(DISTINCT CASE WHEN i.needs_follow_up = true AND i.is_follow_up_complete = false THEN i.id END) as pending_follow_ups,
  MAX(i.start_time) as last_interaction_date,
  t.created_at as tenant_created_at
FROM tenants t
LEFT JOIN students s ON s.tenant_id = t.id
LEFT JOIN users u ON u.tenant_id = t.id
LEFT JOIN interactions i ON i.tenant_id = t.id
GROUP BY t.id, t.name, t.subdomain, t.created_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_statistics_tenant_id 
  ON tenant_statistics(tenant_id);

-- Materialized view for interaction analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS interaction_analytics AS
SELECT 
  i.tenant_id,
  DATE_TRUNC('month', i.start_time) as month,
  rc.name as category_name,
  rs.name as subcategory_name,
  COUNT(*) as interaction_count,
  COUNT(DISTINCT i.student_id) as unique_students,
  COUNT(DISTINCT i.counselor_id) as unique_counselors,
  SUM(i.duration_minutes) as total_minutes,
  AVG(i.duration_minutes) as avg_duration_minutes,
  COUNT(*) FILTER (WHERE i.needs_follow_up = true) as follow_up_count
FROM interactions i
LEFT JOIN reason_categories rc ON i.category_id = rc.id
LEFT JOIN reason_subcategories rs ON i.subcategory_id = rs.id
WHERE i.start_time >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY 
  i.tenant_id, 
  DATE_TRUNC('month', i.start_time),
  rc.name,
  rs.name;

-- Create indexes on interaction analytics
CREATE INDEX IF NOT EXISTS idx_interaction_analytics_tenant_month 
  ON interaction_analytics(tenant_id, month DESC);

CREATE INDEX IF NOT EXISTS idx_interaction_analytics_category 
  ON interaction_analytics(tenant_id, category_name);

-- ============================================================================
-- MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_statistics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY interaction_analytics;
  
  -- Log refresh activity
  INSERT INTO security_events (
    tenant_id, event_type, severity, details
  ) VALUES (
    NULL, 'ANALYTICS_REFRESH', 'LOW',
    json_build_object(
      'views_refreshed', ARRAY['tenant_statistics', 'interaction_analytics'],
      'refresh_time', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get database health statistics
CREATE OR REPLACE FUNCTION get_database_health() RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'total_tenants'::TEXT,
    COUNT(*)::BIGINT,
    'Total number of tenants in the system'::TEXT
  FROM tenants
  
  UNION ALL
  
  SELECT 
    'active_users'::TEXT,
    COUNT(*)::BIGINT,
    'Total number of active users'::TEXT
  FROM users WHERE is_active = true
  
  UNION ALL
  
  SELECT 
    'total_students'::TEXT,
    COUNT(*)::BIGINT,
    'Total number of students'::TEXT
  FROM students
  
  UNION ALL
  
  SELECT 
    'total_interactions'::TEXT,
    COUNT(*)::BIGINT,
    'Total number of interactions'::TEXT
  FROM interactions
  
  UNION ALL
  
  SELECT 
    'pending_follow_ups'::TEXT,
    COUNT(*)::BIGINT,
    'Number of pending follow-ups'::TEXT
  FROM interactions 
  WHERE needs_follow_up = true AND is_follow_up_complete = false
  
  UNION ALL
  
  SELECT 
    'expired_tokens'::TEXT,
    COUNT(*)::BIGINT,
    'Number of expired unused tokens'::TEXT
  FROM (
    SELECT id FROM setup_tokens WHERE expires_at < NOW() AND used_at IS NULL
    UNION ALL
    SELECT id FROM invitations WHERE expires_at < NOW() AND accepted_at IS NULL
  ) expired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for daily maintenance tasks
CREATE OR REPLACE FUNCTION daily_maintenance() RETURNS JSON AS $$
DECLARE
  cleanup_result INTEGER;
  security_cleanup INTEGER;
  health_check JSON;
  result JSON;
BEGIN
  -- Clean up expired tokens
  SELECT cleanup_expired_tokens() INTO cleanup_result;
  
  -- Clean up old security events
  SELECT cleanup_old_security_events() INTO security_cleanup;
  
  -- Refresh analytics views
  PERFORM refresh_analytics_views();
  
  -- Get health statistics
  SELECT json_agg(
    json_build_object(
      'metric', metric_name,
      'value', metric_value,
      'description', description
    )
  ) INTO health_check
  FROM get_database_health();
  
  -- Build result
  result := json_build_object(
    'success', true,
    'tokens_cleaned', cleanup_result,
    'security_events_cleaned', security_cleanup,
    'health_stats', health_check,
    'maintenance_time', NOW()
  );
  
  -- Log maintenance completion
  INSERT INTO security_events (
    tenant_id, event_type, severity, details
  ) VALUES (
    NULL, 'DAILY_MAINTENANCE', 'LOW', result
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View to monitor index usage and query performance
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions for maintenance functions
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO service_role;
GRANT EXECUTE ON FUNCTION daily_maintenance() TO service_role;
GRANT EXECUTE ON FUNCTION get_database_health() TO authenticated;

-- Grant select permissions on materialized views
GRANT SELECT ON tenant_statistics TO authenticated;
GRANT SELECT ON interaction_analytics TO authenticated;
GRANT SELECT ON performance_stats TO authenticated;

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

COMMENT ON MATERIALIZED VIEW tenant_statistics IS 
  'Aggregated statistics per tenant for dashboard display (refresh daily)';

COMMENT ON MATERIALIZED VIEW interaction_analytics IS 
  'Monthly interaction analytics for reporting and trends (refresh daily)';

COMMENT ON FUNCTION refresh_analytics_views IS 
  'Refreshes all materialized views for updated analytics';

COMMENT ON FUNCTION get_database_health IS 
  'Returns key database health metrics and statistics';

COMMENT ON FUNCTION daily_maintenance IS 
  'Performs daily maintenance tasks including cleanup and analytics refresh';

COMMENT ON VIEW performance_stats IS 
  'Monitors index usage and performance for optimization';

-- ============================================================================
-- INITIAL DATA REFRESH
-- ============================================================================

-- Refresh materialized views with initial data
REFRESH MATERIALIZED VIEW tenant_statistics;
REFRESH MATERIALIZED VIEW interaction_analytics;
