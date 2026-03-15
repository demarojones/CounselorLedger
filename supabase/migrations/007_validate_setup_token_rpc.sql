-- Migration 007: Add validate_setup_token RPC
-- Allows unauthenticated clients to validate a setup token without direct
-- table access (which is blocked by RLS for anon users).

CREATE OR REPLACE FUNCTION validate_setup_token(
  p_token TEXT
) RETURNS JSON AS $$
DECLARE
  v_token_record RECORD;
BEGIN
  IF p_token IS NULL OR trim(p_token) = '' THEN
    RETURN json_build_object('is_valid', false, 'error', 'Token is required');
  END IF;

  -- Iterate over active, unexpired tokens and verify hash server-side
  FOR v_token_record IN
    SELECT * FROM setup_tokens
    WHERE used_at IS NULL AND expires_at > NOW()
  LOOP
    IF verify_token_hash(p_token, v_token_record.token) THEN
      RETURN json_build_object(
        'is_valid',    true,
        'tenant_name', v_token_record.tenant_name,
        'admin_email', v_token_record.admin_email,
        'expires_at',  v_token_record.expires_at
      );
    END IF;
  END LOOP;

  RETURN json_build_object('is_valid', false, 'error', 'Invalid or expired setup token');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('is_valid', false, 'error', 'Failed to validate token: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anon and authenticated roles to call this function
GRANT EXECUTE ON FUNCTION validate_setup_token(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION validate_setup_token(TEXT) IS
  'Validates a plain-text setup token against stored hashes. SECURITY DEFINER so anon users can call it without direct table access.';
