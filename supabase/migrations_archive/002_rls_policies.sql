-- Row Level Security (RLS) Policies Migration
-- This migration implements multi-tenant data isolation and role-based access control

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reason_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reason_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to get current user's tenant_id from JWT or users table
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'ADMIN' FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is a counselor
CREATE OR REPLACE FUNCTION is_counselor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'COUNSELOR' FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TENANTS TABLE POLICIES
-- ============================================================================

-- Users can only view their own tenant
CREATE POLICY tenant_select_policy ON tenants
  FOR SELECT
  USING (id = get_user_tenant_id());

-- Only admins can update tenant information
CREATE POLICY tenant_update_policy ON tenants
  FOR UPDATE
  USING (id = get_user_tenant_id() AND is_admin());

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view other users in their tenant
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Admins can insert new users in their tenant
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND is_admin());

-- Admins can update users in their tenant
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id() AND is_admin());

-- Users can update their own profile
CREATE POLICY users_update_own_policy ON users
  FOR UPDATE
  USING (id = auth.uid());

-- Admins can deactivate users (soft delete)
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  USING (tenant_id = get_user_tenant_id() AND is_admin());

-- ============================================================================
-- STUDENTS TABLE POLICIES
-- ============================================================================

-- All authenticated users in tenant can view students
CREATE POLICY students_select_policy ON students
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- All authenticated users in tenant can create students
CREATE POLICY students_insert_policy ON students
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- All authenticated users in tenant can update students
CREATE POLICY students_update_policy ON students
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Only admins can delete students
CREATE POLICY students_delete_policy ON students
  FOR DELETE
  USING (tenant_id = get_user_tenant_id() AND is_admin());

-- ============================================================================
-- CONTACTS TABLE POLICIES
-- ============================================================================

-- All authenticated users in tenant can view contacts
CREATE POLICY contacts_select_policy ON contacts
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- All authenticated users in tenant can create contacts
CREATE POLICY contacts_insert_policy ON contacts
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- All authenticated users in tenant can update contacts
CREATE POLICY contacts_update_policy ON contacts
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Only admins can delete contacts
CREATE POLICY contacts_delete_policy ON contacts
  FOR DELETE
  USING (tenant_id = get_user_tenant_id() AND is_admin());

-- ============================================================================
-- REASON CATEGORIES TABLE POLICIES
-- ============================================================================

-- All authenticated users in tenant can view reason categories
CREATE POLICY reason_categories_select_policy ON reason_categories
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Only admins can create reason categories
CREATE POLICY reason_categories_insert_policy ON reason_categories
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND is_admin());

-- Only admins can update reason categories
CREATE POLICY reason_categories_update_policy ON reason_categories
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id() AND is_admin());

-- Only admins can delete reason categories
CREATE POLICY reason_categories_delete_policy ON reason_categories
  FOR DELETE
  USING (tenant_id = get_user_tenant_id() AND is_admin());

-- ============================================================================
-- REASON SUBCATEGORIES TABLE POLICIES
-- ============================================================================

-- All authenticated users can view subcategories (filtered by category's tenant)
CREATE POLICY reason_subcategories_select_policy ON reason_subcategories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reason_categories 
      WHERE id = reason_subcategories.category_id 
        AND tenant_id = get_user_tenant_id()
    )
  );

-- Only admins can create subcategories
CREATE POLICY reason_subcategories_insert_policy ON reason_subcategories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reason_categories 
      WHERE id = reason_subcategories.category_id 
        AND tenant_id = get_user_tenant_id()
    ) AND is_admin()
  );

-- Only admins can update subcategories
CREATE POLICY reason_subcategories_update_policy ON reason_subcategories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reason_categories 
      WHERE id = reason_subcategories.category_id 
        AND tenant_id = get_user_tenant_id()
    ) AND is_admin()
  );

-- Only admins can delete subcategories
CREATE POLICY reason_subcategories_delete_policy ON reason_subcategories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reason_categories 
      WHERE id = reason_subcategories.category_id 
        AND tenant_id = get_user_tenant_id()
    ) AND is_admin()
  );

-- ============================================================================
-- INTERACTIONS TABLE POLICIES
-- ============================================================================

-- Counselors can view their own interactions, admins can view all in tenant
CREATE POLICY interactions_select_policy ON interactions
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id() AND
    (counselor_id = auth.uid() OR is_admin())
  );

-- All authenticated users can create interactions (auto-assigned to themselves)
CREATE POLICY interactions_insert_policy ON interactions
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id() AND
    counselor_id = auth.uid()
  );

-- Counselors can update their own interactions, admins can update all
CREATE POLICY interactions_update_policy ON interactions
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id() AND
    (counselor_id = auth.uid() OR is_admin())
  );

-- Counselors can delete their own interactions, admins can delete all
CREATE POLICY interactions_delete_policy ON interactions
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id() AND
    (counselor_id = auth.uid() OR is_admin())
  );

-- ============================================================================
-- VIEWS SECURITY
-- ============================================================================

-- Grant access to views for authenticated users
GRANT SELECT ON student_stats TO authenticated;
GRANT SELECT ON contact_stats TO authenticated;
GRANT SELECT ON pending_follow_ups TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_user_tenant_id() IS 
  'Returns the tenant_id for the currently authenticated user';

COMMENT ON FUNCTION is_admin() IS 
  'Returns true if the currently authenticated user has ADMIN role';

COMMENT ON FUNCTION is_counselor() IS 
  'Returns true if the currently authenticated user has COUNSELOR role';

COMMENT ON POLICY tenant_select_policy ON tenants IS 
  'Users can only view their own tenant information';

COMMENT ON POLICY interactions_select_policy ON interactions IS 
  'Counselors see only their interactions, admins see all interactions in their tenant';

COMMENT ON POLICY interactions_insert_policy ON interactions IS 
  'Users can only create interactions assigned to themselves within their tenant';
