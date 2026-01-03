-- Fix Invitation Auth Integration Migration
-- This migration updates the accept_invitation function to properly integrate with Supabase Auth

-- ============================================================================
-- UPDATED COMPLETE INITIAL SETUP FUNCTION
-- ============================================================================
-- Atomically creates tenant, admin user, and marks setup token as used with Supabase Auth integration
CREATE OR REPLACE FUNCTION complete_initial_setup(
  p_token TEXT,
  p_auth_user_id UUID,
  p_tenant_name TEXT,
  p_subdomain TEXT,
  p_admin_email TEXT,
  p_admin_first_name TEXT,
  p_admin_last_name TEXT,
  p_contact_phone TEXT DEFAULT NULL,
  p_contact_address TEXT DEFAULT NULL
) RETURNS JSON AS $
DECLARE
  v_tenant_id UUID;
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
  
  -- Check if the auth user ID already exists (should not happen in normal flow)
  IF EXISTS (
    SELECT 1 FROM users WHERE id = p_auth_user_id
  ) THEN
    -- Rollback the token update
    UPDATE setup_tokens SET used_at = NULL WHERE id = v_setup_token_id;
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication user already has an application account'
    );
  END IF;
  
  -- Create tenant
  INSERT INTO tenants (name, subdomain, contact_phone, contact_address)
  VALUES (p_tenant_name, p_subdomain, p_contact_phone, p_contact_address)
  RETURNING id INTO v_tenant_id;
  
  -- Create admin user with the Supabase Auth user ID
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
  );
  
  -- Return success with created IDs
  RETURN json_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'user_id', p_auth_user_id,
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION accept_invitation IS 
  'Atomically accepts invitation and creates user account with proper Supabase Auth integration';

COMMENT ON FUNCTION complete_initial_setup IS 
  'Atomically creates tenant, admin user, and marks setup token as used with proper Supabase Auth integration';