-- Update Setup Function for Contact Information
-- This migration updates the complete_initial_setup function to handle
-- the new contact information fields

-- ============================================================================
-- UPDATE COMPLETE INITIAL SETUP FUNCTION
-- ============================================================================
-- Drop the existing function first
DROP FUNCTION IF EXISTS complete_initial_setup(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Recreate with updated signature and contact information handling
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
) RETURNS JSON AS $
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
    -- Return error information
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE ACCEPT INVITATION FUNCTION
-- ============================================================================
-- Drop the existing function first
DROP FUNCTION IF EXISTS accept_invitation(TEXT, TEXT, TEXT, TEXT);

-- Recreate with updated signature to use auth user ID
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token TEXT,
  p_auth_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT
) RETURNS JSON AS $
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

COMMENT ON FUNCTION complete_initial_setup IS 
  'Atomically creates tenant with contact info, admin user, and marks setup token as used';

COMMENT ON FUNCTION accept_invitation IS 
  'Atomically accepts invitation and creates user account using auth user ID';