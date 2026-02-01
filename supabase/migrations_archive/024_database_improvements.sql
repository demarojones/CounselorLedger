-- Database Improvements Migration
-- This migration adds missing constraints, policies, validation, and performance enhancements
-- Based on comprehensive review of existing schema

-- ============================================================================
-- MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraint for interactions regarding_student_id
ALTER TABLE interactions 
ADD CONSTRAINT fk_interactions_regarding_student 
FOREIGN KEY (regarding_student_id) REFERENCES students(id) ON DELETE SET NULL;

-- Add foreign key constraint for privacy_audit_events user_id
ALTER TABLE privacy_audit_events 
ADD CONSTRAINT fk_privacy_audit_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign key constraint for reason_subcategories to ensure proper cascading
ALTER TABLE reason_subcategories 
ADD CONSTRAINT fk_subcategories_category 
FOREIGN KEY (category_id) REFERENCES reason_categories(id) ON DELETE CASCADE;

-- ============================================================================
-- DATA VALIDATION CONSTRAINTS
-- ============================================================================

-- Add email validation constraint
ALTER TABLE users 
ADD CONSTRAINT valid_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add phone number validation for tenants
ALTER TABLE tenants 
ADD CONSTRAINT valid_contact_phone 
CHECK (contact_phone IS NULL OR contact_phone ~* '^\+?[\d\s\-\(\)\.]+$');

-- Add phone number validation for students
ALTER TABLE students 
ADD CONSTRAINT valid_student_phone 
CHECK (phone IS NULL OR phone ~* '^\+?[\d\s\-\(\)\.]+$');

-- Add phone number validation for contacts
ALTER TABLE contacts 
ADD CONSTRAINT valid_contact_phone_number 
CHECK (phone IS NULL OR phone ~* '^\+?[\d\s\-\(\)\.]+$');

-- Add grade level validation
ALTER TABLE students 
ADD CONSTRAINT valid_grade_level 
CHECK (grade_level IS NULL OR grade_level IN (
  'Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
));

-- Add interaction type validation
ALTER TABLE interactions 
ADD CONSTRAINT valid_interaction_type 
CHECK (interaction_type IN (
  'INDIVIDUAL_COUNSELING', 'GROUP_COUNSELING', 'CRISIS_INTERVENTION',
  'PARENT_CONTACT', 'TEACHER_CONSULTATION', 'REFERRAL', 'FOLLOW_UP', 'OTHER'
));

-- Add follow-up status validation
ALTER TABLE interactions 
ADD CONSTRAINT valid_follow_up_status 
CHECK (follow_up_required = false OR follow_up_status IN ('PENDING', 'COMPLETED', 'CANCELLED'));

-- ============================================================================
-- MISSING RLS POLICIES
-- ============================================================================

-- RLS policies for setup_tokens (admin access only)
CREATE POLICY "setup_tokens_admin_access" ON setup_tokens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- RLS policies for invitations (admin access only)
CREATE POLICY "invitations_admin_access" ON invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
    AND users.tenant_id = invitations.tenant_id
  )
);

-- RLS policy for security_events (admin access only)
CREATE POLICY "security_events_admin_access" ON security_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
    AND users.tenant_id = security_events.tenant_id
  )
);

-- ============================================================================
-- ENHANCED PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for reporting and analytics queries
CREATE INDEX idx_interactions_date_tenant ON interactions(tenant_id, interaction_date DESC);
CREATE INDEX idx_students_grade_tenant ON students(tenant_id, grade_level) WHERE grade_level IS NOT NULL;
CREATE INDEX idx_interactions_type_tenant ON interactions(tenant_id, interaction_type);
CREATE INDEX idx_interactions_follow_up ON interactions(tenant_id, follow_up_required, follow_up_status) 
  WHERE follow_up_required = true;

-- Indexes for contact searches
CREATE INDEX idx_contacts_name_tenant ON contacts(tenant_id, first_name, last_name);
CREATE INDEX idx_students_name_tenant ON students(tenant_id, first_name, last_name);

-- Indexes for audit and security queries
CREATE INDEX idx_privacy_audit_action ON privacy_audit_events(tenant_id, action, created_at DESC);
CREATE INDEX idx_security_events_recent ON security_events(tenant_id, created_at DESC) 
  WHERE created_at >= NOW() - INTERVAL '30 days';

-- ============================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up expired tokens and invitations
CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER := 0;
  setup_deleted INTEGER;
  invitation_deleted INTEGER;
BEGIN
  -- Clean up expired setup tokens
  DELETE FROM setup_tokens 
  WHERE expires_at < NOW() AND used_at IS NULL;
  GET DIAGNOSTICS setup_deleted = ROW_COUNT;
  
  -- Clean up expired invitations
  DELETE FROM invitations 
  WHERE expires_at < NOW() AND accepted_at IS NULL;
  GET DIAGNOSTICS invitation_deleted = ROW_COUNT;
  
  deleted_count := setup_deleted + invitation_deleted;
  
  -- Log cleanup activity
  INSERT INTO security_events (
    tenant_id, event_type, severity, details
  ) VALUES (
    NULL, 'TOKEN_CLEANUP', 'LOW',
    json_build_object(
      'setup_tokens_deleted', setup_deleted,
      'invitations_deleted', invitation_deleted,
      'total_deleted', deleted_count
    )
  );
  
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old interactions (soft delete)
CREATE OR REPLACE FUNCTION archive_old_interactions(
  p_tenant_id UUID,
  p_days_old INTEGER DEFAULT 365
) RETURNS INTEGER AS $
DECLARE
  archived_count INTEGER;
BEGIN
  -- Add archived flag if it doesn't exist
  ALTER TABLE interactions ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
  
  -- Archive old interactions
  UPDATE interactions 
  SET archived = TRUE
  WHERE tenant_id = p_tenant_id
    AND interaction_date < NOW() - (p_days_old || ' days')::INTERVAL
    AND archived = FALSE;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Log archival activity
  PERFORM log_security_event(
    p_tenant_id, 
    'DATA_ARCHIVED', 
    'LOW',
    NULL, NULL, NULL, NULL,
    json_build_object(
      'interactions_archived', archived_count,
      'days_old', p_days_old
    )
  );
  
  RETURN archived_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get database health statistics
CREATE OR REPLACE FUNCTION get_database_health() RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT,
  description TEXT
) AS $
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
  WHERE follow_up_required = true AND follow_up_status = 'PENDING'
  
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Materialized view for tenant statistics (refresh daily)
CREATE MATERIALIZED VIEW tenant_statistics AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.subdomain,
  COUNT(DISTINCT s.id) as student_count,
  COUNT(DISTINCT u.id) as active_user_count,
  COUNT(DISTINCT i.id) as total_interactions,
  COUNT(DISTINCT CASE WHEN i.interaction_date >= CURRENT_DATE - INTERVAL '30 days' THEN i.id END) as recent_interactions,
  COUNT(DISTINCT CASE WHEN i.follow_up_required = true AND i.follow_up_status = 'PENDING' THEN i.id END) as pending_follow_ups,
  MAX(i.interaction_date) as last_interaction_date,
  t.created_at as tenant_created_at
FROM tenants t
LEFT JOIN students s ON s.tenant_id = t.id
LEFT JOIN users u ON u.tenant_id = t.id AND u.is_active = true
LEFT JOIN interactions i ON i.tenant_id = t.id
GROUP BY t.id, t.name, t.subdomain, t.created_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_tenant_statistics_tenant_id ON tenant_statistics(tenant_id);

-- Materialized view for interaction analytics
CREATE MATERIALIZED VIEW interaction_analytics AS
SELECT 
  i.tenant_id,
  DATE_TRUNC('month', i.interaction_date) as month,
  i.interaction_type,
  rc.name as category_name,
  rs.name as subcategory_name,
  COUNT(*) as interaction_count,
  COUNT(DISTINCT i.student_id) as unique_students,
  COUNT(DISTINCT i.user_id) as unique_counselors,
  AVG(CASE WHEN i.follow_up_required THEN 1 ELSE 0 END) as follow_up_rate
FROM interactions i
LEFT JOIN reason_categories rc ON i.reason_category_id = rc.id
LEFT JOIN reason_subcategories rs ON i.reason_subcategory_id = rs.id
WHERE i.interaction_date >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY 
  i.tenant_id, 
  DATE_TRUNC('month', i.interaction_date),
  i.interaction_type,
  rc.name,
  rs.name;

-- Create indexes on interaction analytics
CREATE INDEX idx_interaction_analytics_tenant_month ON interaction_analytics(tenant_id, month DESC);
CREATE INDEX idx_interaction_analytics_type ON interaction_analytics(tenant_id, interaction_type);

-- ============================================================================
-- AUTOMATED MAINTENANCE JOBS (FUNCTIONS TO BE CALLED BY CRON)
-- ============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS VOID AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for daily maintenance tasks
CREATE OR REPLACE FUNCTION daily_maintenance() RETURNS JSON AS $
DECLARE
  cleanup_result INTEGER;
  health_check JSON;
  result JSON;
BEGIN
  -- Clean up expired tokens
  SELECT cleanup_expired_tokens() INTO cleanup_result;
  
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
    'cleanup_count', cleanup_result,
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions for maintenance functions to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_tokens() TO service_role;
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO service_role;
GRANT EXECUTE ON FUNCTION daily_maintenance() TO service_role;
GRANT EXECUTE ON FUNCTION get_database_health() TO authenticated;

-- Grant select permissions on materialized views
GRANT SELECT ON tenant_statistics TO authenticated;
GRANT SELECT ON interaction_analytics TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION cleanup_expired_tokens IS 
  'Removes expired setup tokens and invitations, logs cleanup activity';

COMMENT ON FUNCTION archive_old_interactions IS 
  'Archives interactions older than specified days for a tenant';

COMMENT ON FUNCTION get_database_health IS 
  'Returns key database health metrics and statistics';

COMMENT ON FUNCTION daily_maintenance IS 
  'Performs daily maintenance tasks including cleanup and analytics refresh';

COMMENT ON MATERIALIZED VIEW tenant_statistics IS 
  'Aggregated statistics per tenant for dashboard display';

COMMENT ON MATERIALIZED VIEW interaction_analytics IS 
  'Monthly interaction analytics for reporting and trends';

-- ============================================================================
-- INITIAL DATA REFRESH
-- ============================================================================

-- Refresh materialized views with initial data
REFRESH MATERIALIZED VIEW tenant_statistics;
REFRESH MATERIALIZED VIEW interaction_analytics;

-- Log completion of improvements migration
INSERT INTO security_events (
  tenant_id, event_type, severity, details
) VALUES (
  NULL, 'DATABASE_IMPROVEMENTS_APPLIED', 'LOW',
  json_build_object(
    'migration', '024_database_improvements',
    'improvements', ARRAY[
      'foreign_key_constraints',
      'data_validation',
      'rls_policies',
      'performance_indexes',
      'maintenance_functions',
      'materialized_views'
    ],
    'applied_at', NOW()
  )
);