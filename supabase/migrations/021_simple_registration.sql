-- Simple Registration Function for Supabase Auth
-- This creates a function that can be called from the client to register users

-- First, ensure we have a default tenant
INSERT INTO tenants (id, name, subdomain) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Default School',
  'default'
) ON CONFLICT (subdomain) DO NOTHING;

-- Create a function to handle user registration
CREATE OR REPLACE FUNCTION register_user(
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_role TEXT DEFAULT 'COUNSELOR'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_tenant_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  auth_user_id UUID;
  result JSON;
BEGIN
  -- Get the current authenticated user ID from Supabase Auth
  auth_user_id := auth.uid();
  
  IF auth_user_id IS NULL THEN
    result := json_build_object(
      'success', false,
      'error', 'User must be authenticated to register'
    );
    RETURN result;
  END IF;

  -- Check if user already exists in our users table
  IF EXISTS (SELECT 1 FROM users WHERE id = auth_user_id) THEN
    result := json_build_object(
      'success', false,
      'error', 'User already registered'
    );
    RETURN result;
  END IF;

  -- Create the application user record
  INSERT INTO users (
    id,
    tenant_id,
    email,
    first_name,
    last_name,
    role,
    is_active
  ) VALUES (
    auth_user_id,
    default_tenant_id,
    user_email,
    user_first_name,
    user_last_name,
    user_role,
    true
  );

  -- Create default reason categories for the tenant if they don't exist
  INSERT INTO reason_categories (tenant_id, name, color, sort_order)
  SELECT 
    default_tenant_id,
    category_name,
    category_color,
    category_order
  FROM (
    VALUES 
      ('Academic', '#3B82F6', 1),
      ('Behavioral', '#EF4444', 2),
      ('Social-Emotional', '#10B981', 3),
      ('Career/College', '#8B5CF6', 4),
      ('Family/Personal', '#F59E0B', 5)
  ) AS categories(category_name, category_color, category_order)
  ON CONFLICT (tenant_id, name) DO NOTHING;

  result := json_build_object(
    'success', true,
    'user_id', auth_user_id,
    'message', 'User registered successfully'
  );

  RETURN result;

EXCEPTION
  WHEN unique_violation THEN
    result := json_build_object(
      'success', false,
      'error', 'User with this email already exists'
    );
    RETURN result;
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION register_user TO authenticated;

-- Update the trigger function to handle new auth users
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_tenant_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Only create application user if it doesn't exist and has metadata
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.id) AND 
     NEW.raw_user_meta_data IS NOT NULL AND 
     NEW.raw_user_meta_data->>'first_name' IS NOT NULL THEN
    
    INSERT INTO users (
      id,
      tenant_id,
      email,
      first_name,
      last_name,
      role,
      is_active
    ) VALUES (
      NEW.id,
      default_tenant_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'role', 'COUNSELOR'),
      true
    );

    -- Create default reason categories for the tenant if they don't exist
    INSERT INTO reason_categories (tenant_id, name, color, sort_order)
    SELECT 
      default_tenant_id,
      category_name,
      category_color,
      category_order
    FROM (
      VALUES 
        ('Academic', '#3B82F6', 1),
        ('Behavioral', '#EF4444', 2),
        ('Social-Emotional', '#10B981', 3),
        ('Career/College', '#8B5CF6', 4),
        ('Family/Personal', '#F59E0B', 5)
    ) AS categories(category_name, category_color, category_order)
    ON CONFLICT (tenant_id, name) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();