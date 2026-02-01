-- Security and Audit Events Migration
-- This migration creates comprehensive security logging and privacy compliance tracking

-- ============================================================================
-- SECURITY EVENTS TABLE
-- ============================================================================
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
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
  )),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  email TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_security_events_tenant ON security_events(tenant_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_time ON security_events(created_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_ip ON security_events(ip_address);
CREATE INDEX idx_security_events_email ON security_events(email);

-- Composite indexes for common queries
CREATE INDEX idx_security_events_tenant_type ON security_events(tenant_id, event_type);
CREATE INDEX idx_security_events_tenant_severity ON security_events(tenant_id, severity);
CREATE INDEX idx_security_events_tenant_time ON security_events(tenant_id, created_at DESC);

-- Index for privacy compliance queries
CREATE INDEX idx_security_events_privacy_compliance 
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
CREATE INDEX idx_security_events_resource_audit 
ON security_events USING GIN(details) 
WHERE details ? 'resourceId';

-- Index for privacy violation queries
CREATE INDEX idx_security_events_violations 
ON security_events(tenant_id, created_at DESC) 
WHERE event_type = 'PRIVACY_VIOLATION_ATTEMPT';

-- ============================================================================
-- SECURITY EVENT VIEWS
-- ============================================================================

-- View for security event statistics and summaries
CREATE OR REPLACE VIEW security_event_summary AS
SELECT 
  tenant_id,
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT email) as unique_emails,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence,
  DATE_TRUNC('day', created_at) as event_date
FROM security_events
GROUP BY tenant_id, event_type, severity, DATE_TRUNC('day', created_at);

-- View for identifying potentially suspicious patterns
CREATE OR REPLACE VIEW suspicious_activity AS
SELECT 
  tenant_id,
  ip_address,
  email,
  COUNT(*) as event_count,
  COUNT(DISTINCT event_type) as event_types,
  MAX(created_at) as last_event,
  ARRAY_AGG(DISTINCT event_type) as event_type_list,
  CASE 
    WHEN COUNT(*) > 10 AND COUNT(DISTINCT event_type) > 3 THEN 'HIGH'
    WHEN COUNT(*) > 5 THEN 'MEDIUM'
    ELSE 'LOW'
  END as risk_level
FROM security_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND severity IN ('MEDIUM', 'HIGH', 'CRITICAL')
GROUP BY tenant_id, ip_address, email
HAVING COUNT(*) > 2
ORDER BY event_count DESC, last_event DESC;

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_severity TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO security_events (
    tenant_id,
    event_type,
    severity,
    user_id,
    ip_address,
    user_agent,
    email,
    details
  ) VALUES (
    p_tenant_id,
    p_event_type,
    p_severity,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_email,
    p_details
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old security events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_events() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security event statistics for a tenant
CREATE OR REPLACE FUNCTION get_security_stats(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS TABLE (
  event_type TEXT,
  severity TEXT,
  event_count BIGINT,
  unique_ips BIGINT,
  last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.event_type,
    se.severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT se.ip_address) as unique_ips,
    MAX(se.created_at) as last_occurrence
  FROM security_events se
  WHERE se.tenant_id = p_tenant_id
    AND se.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY se.event_type, se.severity
  ORDER BY event_count DESC, last_occurrence DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- RLS POLICIES FOR SECURITY EVENTS
-- ============================================================================

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Security events: Admin access only
CREATE POLICY security_events_admin_access ON security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
      AND users.tenant_id = security_events.tenant_id
    )
  );

-- Grant access to views
GRANT SELECT ON security_event_summary TO authenticated;
GRANT SELECT ON suspicious_activity TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE security_events IS 
  'Comprehensive security and privacy event logging for audit and compliance';

COMMENT ON VIEW security_event_summary IS 
  'Aggregated security event statistics by tenant, type, and severity';

COMMENT ON VIEW suspicious_activity IS 
  'Identifies potentially suspicious activity patterns in the last 24 hours';

COMMENT ON FUNCTION log_security_event IS 
  'Logs a security event with optional context information';

COMMENT ON FUNCTION cleanup_old_security_events IS 
  'Removes security events older than 90 days';

COMMENT ON FUNCTION get_security_stats IS 
  'Returns security event statistics for a tenant over a specified period';

COMMENT ON FUNCTION get_privacy_compliance_stats IS 
  'Returns privacy compliance metrics including access patterns and violations';

COMMENT ON FUNCTION get_interaction_audit_trail IS 
  'Returns audit trail for a specific interaction without exposing content';

COMMENT ON FUNCTION get_privacy_violation_summary IS 
  'Returns summary of privacy violations by type for a tenant';
