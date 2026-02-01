-- Setup and Invitations Migration
-- This migration adds tables and functions for tenant setup and user invitation workflows

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
-- SETUP FUNCTIONS
-- ============================================================================

-- Function to complete initial tenant setup
CREATE OR REPLACE FUNCTION complete_initial_setup(
  p_token TEXT,
  p_auth_user_id UUID,
  p_tenant_name TEXT,
  p_subdomain TEXT,
  p_admin_email TEXT,
  p_admin_first_name TEXT,
  p_admin_last_name TEXT,
  p_contact_phone TEXT DEFAULT NULL,
  p_contact_address TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_contact_person_name TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_setup_token_id UUID;
BEGIN
  -- Validate and mark setup token as used
  UPDATE setup_tokens 
  SET used_at = NOW()
  WHERE token = p_token 
    AND used_at IS NULL 
    AND expires_at > NOW()
    AND tenant_name = p_tenant_name
    AND admin_email = p_admin_email
  RETURNING id INTO v_setup_token_id;
  
  -- Check if token was found and updated
  IF v_setup_token_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid, expired, or already used setup token'
    );
  END IF;
  
  -- Check if subdomain is unique
  IF EXISTS (SELECT 1 FROM tenants WHERE subdomain = p_subdomain) THEN
    UPDATE setup_tokens SET used_at = NULL WHERE id = v_setup_token_id;
    RETURN json_build_object(
      'success', false,
      'error', 'Subdomain is already taken'
    );
  END IF;
  
  -- Create tenant with contact information
  INSERT INTO tenants (
    name, 
    subdomain, 
    contact_phone, 
    contact_address, 
    contact_email, 
    contact_person_name
  )
  VALUES (
    p_tenant_name, 
    p_subdomain, 
    p_contact_phone, 
    p_contact_address, 
    p_contact_email, 
    p_contact_person_name
  )
  RETURNING id INTO v_tenant_id;
  
  -- Create admin user using the auth user ID
  INSERT INTO users (
    id,
    tenant_id,
    email,
    first_name,
    last_name,
    role,
    is_active
  ) VALUES (
    p_auth_user_id,
    v_tenant_id,
    p_admin_email,
    p_admin_first_name,
    p_admin_last_name,
    'ADMIN',
    true
  ) RETURNING id INTO v_user_id;
  
  -- Return success with created IDs
  RETURN json_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'user_id', v_user_id,
    'setup_token_id', v_setup_token_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token TEXT,
  p_auth_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT
) RETURNS JSON AS $$
DECLARE
  v_invitation_id UUID;
  v_tenant_id UUID;
  v_email TEXT;
  v_role TEXT;
  v_user_id UUID;
BEGIN
  -- Validate and mark invitation as accepted
  UPDATE invitations 
  SET accepted_at = NOW()
  WHERE token = p_token 
    AND accepted_at IS NULL 
    AND expires_at > NOW()
  RETURNING id, tenant_id, email, role INTO v_invitation_id, v_tenant_id, v_email, v_role;
  
  -- Check if invitation was found and updated
  IF v_invitation_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid, expired, or already used invitation token'
    );
  END IF;
  
  -- Check if user already exists in this tenant
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE (tenant_id = v_tenant_id AND email = v_email) 
       OR id = p_auth_user_id
  ) THEN
    UPDATE invitations SET accepted_at = NULL WHERE id = v_invitation_id;
    RETURN json_build_object(
      'success', false,
      'error', 'User with this email already exists in the organization'
    );
  END IF;
  
  -- Create user account using the auth user ID
  INSERT INTO users (
    id,
    tenant_id,
    email,
    first_name,
    last_name,
    role,
    is_active
  ) VALUES (
    p_auth_user_id,
    v_tenant_id,
    v_email,
    p_first_name,
    p_last_name,
    v_role::TEXT,
    true
  ) RETURNING id INTO v_user_id;
  
  -- Return success with created user ID
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'invitation_id', v_invitation_id,
    'tenant_id', v_tenant_id,
    'email', v_email,
    'role', v_role
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired tokens and invitations
CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_setup_deleted INTEGER;
  v_invitation_deleted INTEGER;
BEGIN
  -- Delete expired setup tokens that are older than 7 days
  DELETE FROM setup_tokens 
  WHERE expires_at < NOW() - INTERVAL '7 days'
    AND used_at IS NULL;
  GET DIAGNOSTICS v_setup_deleted = ROW_COUNT;
  
  -- Delete expired invitations that are older than 7 days
  DELETE FROM invitations 
  WHERE expires_at < NOW() - INTERVAL '7 days'
    AND accepted_at IS NULL;
  GET DIAGNOSTICS v_invitation_deleted = ROW_COUNT;
  
  v_deleted_count := v_setup_deleted + v_invitation_deleted;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES FOR SETUP AND INVITATION TABLES
-- ============================================================================

ALTER TABLE setup_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Setup tokens: Admin access only
CREATE POLICY setup_tokens_admin_access ON setup_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

-- Invitations: Admin access only within their tenant
CREATE POLICY invitations_admin_access ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
      AND users.tenant_id = invitations.tenant_id
    )
  );

-- Grant access to views
GRANT SELECT ON pending_invitations TO authenticated;
GRANT SELECT ON setup_token_status TO authenticated;

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

COMMENT ON FUNCTION complete_initial_setup IS 
  'Atomically creates tenant with contact info, admin user, and marks setup token as used';

COMMENT ON FUNCTION accept_invitation IS 
  'Atomically accepts invitation and creates user account using auth user ID';

COMMENT ON FUNCTION cleanup_expired_tokens IS 
  'Cleans up expired setup tokens and invitations older than 7 days';
