-- Setup and Invitations Migration (FIXED VERSION)
-- This migration adds tables and functions for tenant setup and user invitation workflows
-- CRITICAL FIX: Token validation now properly verifies hashed tokens

-- ============================================================================
-- SETUP TOKENS TABLE
-- ============================================================================
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
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_token_hash(
  p_plain_token TEXT,
  p_hashed_token TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_salt TEXT;
  v_computed_hash TEXT;
BEGIN
  v_salt := split_part(p_hashed_token, ':', 1);
  v_computed_hash := v_salt || ':' || encode(digest(p_plain_token || v_salt, 'sha256'), 'hex');
  RETURN v_computed_hash = p_hashed_token;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- ============================================================================
-- SETUP FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_setup_token(
  p_tenant_name TEXT,
  p_subdomain TEXT,
  p_admin_email TEXT,
  p_expiration_hours INTEGER DEFAULT 24
) RETURNS JSON AS $$
DECLARE
  v_token TEXT;
  v_hashed_token TEXT;
  v_salt TEXT;
  v_token_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_token := encode(gen_random_bytes(24), 'base64');
  v_token := replace(replace(replace(v_token, '+', ''), '/', ''), '=', '');
  v_token := substring(v_token, 1, 32);
  
  v_salt := encode(gen_random_bytes(16), 'hex');
  v_hashed_token := v_salt || ':' || encode(digest(v_token || v_salt, 'sha256'), 'hex');
  v_expires_at := NOW() + (p_expiration_hours || ' hours')::INTERVAL;
  
  INSERT INTO setup_tokens (
    token, tenant_name, tenant_subdomain, admin_email, expires_at
  ) VALUES (
    v_hashed_token, p_tenant_name, p_subdomain, p_admin_email, v_expires_at
  ) RETURNING id INTO v_token_id;
  
  RETURN json_build_object(
    'success', true,
    'token', v_token,
    'token_id', v_token_id,
    'tenant_name', p_tenant_name,
    'subdomain', p_subdomain,
    'admin_email', p_admin_email,
    'expires_at', v_expires_at
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to create setup token: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  v_token_record RECORD;
BEGIN
  FOR v_token_record IN 
    SELECT * FROM setup_tokens 
    WHERE used_at IS NULL AND expires_at > NOW()
      AND tenant_name = p_tenant_name AND admin_email = p_admin_email
  LOOP
    IF verify_token_hash(p_token, v_token_record.token) THEN
      UPDATE setup_tokens SET used_at = NOW()
      WHERE id = v_token_record.id RETURNING id INTO v_setup_token_id;
      EXIT;
    END IF;
  END LOOP;
  
  IF v_setup_token_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid, expired, or already used setup token');
  END IF;
  
  IF EXISTS (SELECT 1 FROM tenants WHERE subdomain = p_subdomain) THEN
    UPDATE setup_tokens SET used_at = NULL WHERE id = v_setup_token_id;
    RETURN json_build_object('success', false, 'error', 'Subdomain is already taken');
  END IF;
  
  INSERT INTO tenants (name, subdomain, contact_phone, contact_address, contact_email, contact_person_name)
  VALUES (p_tenant_name, p_subdomain, p_contact_phone, p_contact_address, p_contact_email, p_contact_person_name)
  RETURNING id INTO v_tenant_id;
  
  INSERT INTO users (id, tenant_id, email, first_name, last_name, role, is_active)
  VALUES (p_auth_user_id, v_tenant_id, p_admin_email, p_admin_first_name, p_admin_last_name, 'ADMIN', true)
  RETURNING id INTO v_user_id;
  
  RETURN json_build_object('success', true, 'tenant_id', v_tenant_id, 'user_id', v_user_id, 'setup_token_id', v_setup_token_id);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Database error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  v_invitation_record RECORD;
BEGIN
  FOR v_invitation_record IN 
    SELECT * FROM invitations WHERE accepted_at IS NULL AND expires_at > NOW()
  LOOP
    IF verify_token_hash(p_token, v_invitation_record.token) THEN
      UPDATE invitations SET accepted_at = NOW()
      WHERE id = v_invitation_record.id
      RETURNING id, tenant_id, email, role INTO v_invitation_id, v_tenant_id, v_email, v_role;
      EXIT;
    END IF;
  END LOOP;
  
  IF v_invitation_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid, expired, or already used invitation token');
  END IF;
  
  IF EXISTS (SELECT 1 FROM users WHERE (tenant_id = v_tenant_id AND email = v_email) OR id = p_auth_user_id) THEN
    UPDATE invitations SET accepted_at = NULL WHERE id = v_invitation_id;
    RETURN json_build_object('success', false, 'error', 'User with this email already exists in the organization');
  END IF;
  
  INSERT INTO users (id, tenant_id, email, first_name, last_name, role, is_active)
  VALUES (p_auth_user_id, v_tenant_id, v_email, p_first_name, p_last_name, v_role::TEXT, true)
  RETURNING id INTO v_user_id;
  
  RETURN json_build_object('success', true, 'user_id', v_user_id, 'invitation_id', v_invitation_id, 'tenant_id', v_tenant_id, 'email', v_email, 'role', v_role);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Database error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_setup_deleted INTEGER;
  v_invitation_deleted INTEGER;
BEGIN
  DELETE FROM setup_tokens WHERE expires_at < NOW() - INTERVAL '7 days' AND used_at IS NULL;
  GET DIAGNOSTICS v_setup_deleted = ROW_COUNT;
  
  DELETE FROM invitations WHERE expires_at < NOW() - INTERVAL '7 days' AND accepted_at IS NULL;
  GET DIAGNOSTICS v_invitation_deleted = ROW_COUNT;
  
  v_deleted_count := v_setup_deleted + v_invitation_deleted;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE setup_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY setup_tokens_admin_access ON setup_tokens
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN'));

CREATE POLICY invitations_admin_access ON invitations
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN' AND users.tenant_id = invitations.tenant_id));

GRANT SELECT ON pending_invitations TO authenticated;
GRANT SELECT ON setup_token_status TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION verify_token_hash IS 'Verifies a plain token against a hashed token (salt:hash format) using SHA-256';
COMMENT ON FUNCTION complete_initial_setup IS 'Atomically creates tenant with contact info, admin user, and marks setup token as used. FIXED: Now properly verifies hashed tokens.';
COMMENT ON FUNCTION accept_invitation IS 'Atomically accepts invitation and creates user account using auth user ID. FIXED: Now properly verifies hashed tokens.';
