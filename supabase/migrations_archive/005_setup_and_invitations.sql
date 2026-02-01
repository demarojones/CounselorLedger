-- Setup and Invitations Migration
-- This migration adds tables for initial system setup and user invitation workflows

-- ============================================================================
-- SETUP TOKENS TABLE
-- ============================================================================
-- Stores secure tokens for initial tenant setup and first admin user creation
CREATE TABLE setup_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  tenant_name TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for setup_tokens
CREATE INDEX idx_setup_tokens_token ON setup_tokens(token);
CREATE INDEX idx_setup_tokens_expires ON setup_tokens(expires_at);
CREATE INDEX idx_setup_tokens_subdomain ON setup_tokens(tenant_subdomain);
CREATE INDEX idx_setup_tokens_email ON setup_tokens(admin_email);

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================
-- Stores user invitations for joining existing tenants
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'COUNSELOR')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Indexes for invitations
CREATE INDEX idx_invitations_tenant ON invitations(tenant_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_expires ON invitations(expires_at);
CREATE INDEX idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX idx_invitations_pending ON invitations(tenant_id, expires_at) 
  WHERE accepted_at IS NULL;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Apply updated_at trigger to new tables
CREATE TRIGGER update_setup_tokens_updated_at 
  BEFORE UPDATE ON setup_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invitations_updated_at 
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for pending invitations with inviter information
CREATE OR REPLACE VIEW pending_invitations AS
SELECT 
  i.id,
  i.tenant_id,
  i.email,
  i.role,
  i.token,
  i.expires_at,
  i.created_at,
  u.first_name AS invited_by_first_name,
  u.last_name AS invited_by_last_name,
  u.email AS invited_by_email,
  t.name AS tenant_name,
  CASE 
    WHEN i.expires_at < NOW() THEN TRUE 
    ELSE FALSE 
  END AS is_expired
FROM invitations i
JOIN users u ON i.invited_by = u.id
JOIN tenants t ON i.tenant_id = t.id
WHERE i.accepted_at IS NULL
ORDER BY i.created_at DESC;

-- View for setup token status
CREATE OR REPLACE VIEW setup_token_status AS
SELECT 
  id,
  token,
  tenant_name,
  tenant_subdomain,
  admin_email,
  expires_at,
  used_at,
  created_at,
  CASE 
    WHEN used_at IS NOT NULL THEN 'USED'
    WHEN expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END AS status
FROM setup_tokens
ORDER BY created_at DESC;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE setup_tokens IS 
  'Stores secure tokens for initial tenant setup and first admin user creation';

COMMENT ON TABLE invitations IS 
  'Stores user invitations for joining existing tenants with role-based access';

COMMENT ON VIEW pending_invitations IS 
  'Shows all pending invitations with inviter and tenant information';

COMMENT ON VIEW setup_token_status IS 
  'Shows setup tokens with their current status (ACTIVE, EXPIRED, or USED)';

COMMENT ON COLUMN setup_tokens.token IS 
  'Cryptographically secure random token for setup authentication';

COMMENT ON COLUMN invitations.token IS 
  'Cryptographically secure random token for invitation authentication';

COMMENT ON CONSTRAINT invitations_tenant_id_email_key ON invitations IS 
  'Prevents duplicate invitations for the same email within a tenant';
