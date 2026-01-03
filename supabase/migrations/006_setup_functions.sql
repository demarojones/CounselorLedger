-- Setup Functions Migration
-- This migration adds database functions for atomic setup operations

-- ============================================================================
-- COMPLETE INITIAL SETUP FUNCTION
-- ============================================================================
-- Atomically creates tenant, admin user, and marks setup token as used
CREATE OR REPLACE FUNCTION complete_initial_setup(
  p_token TEXT,
  p_tenant_name TEXT,
  p_subdomain TEXT,
  p_admin_email TEXT,
  p_admin_password TEXT,
  p_admin_first_name TEXT,
  p_admin_last_name TEXT,
  p_contact_phone TEXT DEFAULT NULL,
  p_contact_address TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_setup_token_id UUID;
  v_result JSON;
BEGIN
  -- Start transaction (implicit in function)
  
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
    -- Rollback the token update
    UPDATE setup_tokens SET used_at = NULL WHERE id = v_setup_token_id;
    RETURN json_build_object(
      'success', false,
      'error', 'Subdomain is already taken'
    );
  END IF;
  
  -- Create tenant
  INSERT INTO tenants (name, subdomain)
  VALUES (p_tenant_name, p_subdomain)
  RETURNING id INTO v_tenant_id;
  
  -- Create admin user
  INSERT INTO users (
    tenant_id,
    email,
    first_name,
    last_name,
    role,
    is_active
  ) VALUES (
    v_tenant_id,
    p_admin_email,
    p_admin_first_name,
    p_admin_last_name,
    'ADMIN',
    true
  ) RETURNING id INTO v_user_id;
  
  -- Store contact information if provided
  IF p_contact_phone IS NOT NULL OR p_contact_address IS NOT NULL THEN
    -- Add contact info to tenant (assuming we add these columns later)
    -- For now, we'll store in a separate contact record or extend tenant table
    UPDATE tenants 
    SET 
      contact_phone = p_contact_phone,
      contact_address = p_contact_address
    WHERE id = v_tenant_id;
  END IF;
  
  -- Return success with created IDs
  RETURN json_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'user_id', v_user_id,
    'setup_token_id', v_setup_token_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADD CONTACT FIELDS TO TENANTS TABLE
-- ============================================================================
-- Add optional contact information fields to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_address TEXT;

-- ============================================================================
-- CLEANUP EXPIRED TOKENS FUNCTION
-- ============================================================================
-- Function to clean up expired setup tokens and invitations
CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  -- Delete expired setup tokens that are older than 7 days
  DELETE FROM setup_tokens 
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Delete expired invitations that are older than 7 days
  DELETE FROM invitations 
  WHERE expires_at < NOW() - INTERVAL '7 days'
    AND accepted_at IS NULL;
  
  GET DIAGNOSTICS v_deleted_count = v_deleted_count + ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION complete_initial_setup IS 
  'Atomically creates tenant, admin user, and marks setup token as used';

COMMENT ON FUNCTION cleanup_expired_tokens IS 
  'Cleans up expired setup tokens and invitations older than 7 days';

COMMENT ON COLUMN tenants.contact_phone IS 
  'Optional contact phone number for the tenant organization';

COMMENT ON COLUMN tenants.contact_address IS 
  'Optional contact address for the tenant organization';
-- =====
=======================================================================
-- ACCEPT INVITATION FUNCTION
-- ============================================================================
-- Atomically accepts invitation and creates user account
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_password TEXT
) RETURNS JSON AS $$
DECLARE
  v_invitation_id UUID;
  v_tenant_id UUID;
  v_email TEXT;
  v_role TEXT;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Start transaction (implicit in function)
  
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
    WHERE tenant_id = v_tenant_id AND email = v_email
  ) THEN
    -- Rollback the invitation acceptance
    UPDATE invitations SET accepted_at = NULL WHERE id = v_invitation_id;
    RETURN json_build_object(
      'success', false,
      'error', 'User with this email already exists in the organization'
    );
  END IF;
  
  -- Create user account
  INSERT INTO users (
    tenant_id,
    email,
    first_name,
    last_name,
    role,
    is_active
  ) VALUES (
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
    -- Return error information
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADDITIONAL COMMENTS
-- ============================================================================

COMMENT ON FUNCTION accept_invitation IS 
  'Atomically accepts invitation and creates user account with proper validation';