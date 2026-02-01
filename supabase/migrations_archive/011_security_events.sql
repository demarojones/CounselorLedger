-- Security Events Migration
-- This migration creates the security_events table for logging security-related activities

-- ============================================================================
-- SECURITY EVENTS TABLE
-- ============================================================================
-- Stores security events for monitoring and audit purposes
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
    'INVALID_TOKEN_ACCESS'
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

-- ============================================================================
-- SECURITY EVENT SUMMARY VIEW
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

-- ============================================================================
-- SUSPICIOUS ACTIVITY VIEW
-- ============================================================================
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
-- FUNCTIONS
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