-- Simplified Authentication Migration
-- This migration simplifies the system to basic registration/login without multi-tenant complexity

-- First, let's create a simple single-tenant setup
-- We'll keep one default tenant for now but simplify the user creation process

-- Insert a default tenant if it doesn't exist
INSERT INTO tenants (id, name, subdomain) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Default School',
  'default'
) ON CONFLICT (subdomain) DO NOTHING;

-- Create a simplified user registration function
CREATE OR REPLACE FUNCTION create_user_account(
  user_email TEXT,
  user_password TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_role TEXT DEFAULT 'COUNSELOR'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  default_tenant_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  result JSON;
BEGIN
  -- Create the auth user
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    'authenticated'
  ) RETURNING id INTO new_user_id;

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
    new_user_id,
    default_tenant_id,
    user_email,
    user_first_name,
    user_last_name,
    user_role,
    true
  );

  -- Create default reason categories for new users if they don't exist
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
    'user_id', new_user_id,
    'message', 'User account created successfully'
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

-- Create a function to handle user registration from the application
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_tenant_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Only create application user if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
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
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_account TO anon, authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user_registration TO service_role;

-- Enable RLS policies for simplified access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reason_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reason_subcategories ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (single tenant for now)
CREATE POLICY "Users can view their own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view students in their tenant" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tenant_id = students.tenant_id
    )
  );

CREATE POLICY "Users can view contacts in their tenant" ON contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tenant_id = contacts.tenant_id
    )
  );

CREATE POLICY "Users can view interactions in their tenant" ON interactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tenant_id = interactions.tenant_id
    )
  );

CREATE POLICY "Users can view reason categories in their tenant" ON reason_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tenant_id = reason_categories.tenant_id
    )
  );

CREATE POLICY "Users can view reason subcategories" ON reason_subcategories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN reason_categories rc ON rc.tenant_id = u.tenant_id
      WHERE u.id = auth.uid() 
      AND rc.id = reason_subcategories.category_id
    )
  );