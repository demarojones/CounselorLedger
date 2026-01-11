-- Privacy Audit Events Migration
-- This migration extends the security_events table to support privacy compliance audit logging

-- ============================================================================
-- UPDATE SECURITY EVENT TYPES
-- ============================================================================
-- Add new privacy-related event types to the security_events table constraint

-- Drop the existing constraint
ALTER TABLE security_events DROP CONSTRAINT IF EXISTS security_events_event_type_check;

-- Add the updated constraint with privacy event types
ALTER TABLE security_events ADD CONSTRAINT security_events_event_type_check 
CHECK (event_type IN (
  'INVITATION_CREATED',
  'INVITATION_ACCEPTED',
  'INVITATION_FAILED',
  'INVITATION_EXPIRED',
  'INVITATION_CANCELLED',
  'INVITATION_RESENT',
  'SETUP_TOKEN_USED',
  'SETUP_TOKEN_FAILED',
  'RATE_LIMIT_EXCEEDED',
  'SUSPICIOUS_ACTIVITY',
  'AUTH_FAILURE',
  'TOKEN_MANIPULATION',
  'DUPLICATE_EMAIL_ATTEMPT',
  'INVALID_TOKEN_ACCESS',
  'INTERACTION_ACCESS',
  'INTERACTION_CREATE',
  'INTERACTION_UPDATE',
  'INTERACTION_DELETE',
  'INTERACTION_BULK_ACCESS',
  'PRIVACY_VIOLATION_ATTEMPT',
  'UNAUTHORIZED_INTERACTION_ACCESS',
  'CROSS_COUNSELOR_ACCESS_DENIED',
  'ADMIN_AGGREGATED_ACCESS',
  'INTERACTION_SEARCH',
  'STUDENT_INTERACTION_HISTORY_ACCESS',
  'CONTACT_INTERACTION_HISTORY_ACCESS'
));

-- ============================================================================
-- PRIVACY COMPLIANCE FUNCTIONS
-- ============================================================================

-- Function to get privacy compliance statistics for a tenant
CREATE OR REPLACE FUNCTION get_privacy_compliance_stats(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE (
  total_access_events BIGINT,
  authorized_access BIGINT,
  denied_access BIGINT,
  privacy_violations BIGINT,
  unique_users BIGINT,
  compliance_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH privacy_events AS (
    SELECT 
      *,
      CASE 
        WHEN event_type IN ('PRIVACY_VIOLATION_ATTEMPT', 'UNAUTHORIZED_INTERACTION_ACCESS', 'CROSS_COUNSELOR_ACCESS_DENIED') 
        THEN false
        WHEN details->>'accessGranted' = 'false' 
        THEN false
        ELSE true
      END as is_authorized
    FROM security_events 
    WHERE tenant_id = p_tenant_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
      AND event_type IN (
        'INTERACTION_ACCESS',
        'INTERACTION_CREATE',
        'INTERACTION_UPDATE',
        'INTERACTION_DELETE',
        'INTERACTION_BULK_ACCESS',
        'PRIVACY_VIOLATION_ATTEMPT',
        'UNAUTHORIZED_INTERACTION_ACCESS',
        'CROSS_COUNSELOR_ACCESS_DENIED',
        'ADMIN_AGGREGATED_ACCESS',
        'INTERACTION_SEARCH',
        'STUDENT_INTERACTION_HISTORY_ACCESS',
        'CONTACT_INTERACTION_HISTORY_ACCESS'
      )
  )
  SELECT 
    COUNT(*)::BIGINT as total_access_events,
    COUNT(*) FILTER (WHERE is_authorized = true)::BIGINT as authorized_access,
    COUNT(*) FILTER (WHERE is_authorized = false)::BIGINT as denied_access,
    COUNT(*) FILTER (WHERE event_type IN ('PRIVACY_VIOLATION_ATTEMPT', 'UNAUTHORIZED_INTERACTION_ACCESS', 'CROSS_COUNSELOR_ACCESS_DENIED'))::BIGINT as privacy_violations,
    COUNT(DISTINCT user_id)::BIGINT as unique_users,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE is_authorized = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 100.00
    END as compliance_score
  FROM privacy_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get interaction audit trail (without exposing content)
CREATE OR REPLACE FUNCTION get_interaction_audit_trail(
  p_tenant_id UUID,
  p_interaction_id TEXT
) RETURNS TABLE (
  event_type TEXT,
  operation TEXT,
  user_id UUID,
  access_granted BOOLEAN,
  created_at TIMESTAMPTZ,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.event_type,
    COALESCE(se.details->>'operation', 'unknown') as operation,
    se.user_id,
    COALESCE((se.details->>'accessGranted')::BOOLEAN, true) as access_granted,
    se.created_at,
    se.details->>'userRole' as user_role
  FROM security_events se
  WHERE se.tenant_id = p_tenant_id
    AND se.details->>'resourceId' = p_interaction_id
  ORDER BY se.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get privacy violation summary
CREATE OR REPLACE FUNCTION get_privacy_violation_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS TABLE (
  violation_type TEXT,
  violation_count BIGINT,
  unique_users BIGINT,
  last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.details->>'violationType' as violation_type,
    COUNT(*)::BIGINT as violation_count,
    COUNT(DISTINCT se.user_id)::BIGINT as unique_users,
    MAX(se.created_at) as last_occurrence
  FROM security_events se
  WHERE se.tenant_id = p_tenant_id
    AND se.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND se.event_type = 'PRIVACY_VIOLATION_ATTEMPT'
  GROUP BY se.details->>'violationType'
  ORDER BY violation_count DESC, last_occurrence DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEXES FOR PRIVACY AUDIT QUERIES
-- ============================================================================

-- Index for privacy compliance queries
CREATE INDEX IF NOT EXISTS idx_security_events_privacy_compliance 
ON security_events(tenant_id, created_at DESC) 
WHERE event_type IN (
  'INTERACTION_ACCESS',
  'INTERACTION_CREATE',
  'INTERACTION_UPDATE',
  'INTERACTION_DELETE',
  'INTERACTION_BULK_ACCESS',
  'PRIVACY_VIOLATION_ATTEMPT',
  'UNAUTHORIZED_INTERACTION_ACCESS',
  'CROSS_COUNSELOR_ACCESS_DENIED',
  'ADMIN_AGGREGATED_ACCESS',
  'INTERACTION_SEARCH',
  'STUDENT_INTERACTION_HISTORY_ACCESS',
  'CONTACT_INTERACTION_HISTORY_ACCESS'
);

-- Index for audit trail queries
CREATE INDEX IF NOT EXISTS idx_security_events_resource_audit 
ON security_events USING GIN(details) 
WHERE details ? 'resourceId';

-- Index for privacy violation queries
CREATE INDEX IF NOT EXISTS idx_security_events_violations 
ON security_events(tenant_id, created_at DESC) 
WHERE event_type = 'PRIVACY_VIOLATION_ATTEMPT';