-- Initial Schema Migration for School Counselor Ledger
-- This migration creates the core database structure for multi-tenant counseling management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
-- Stores information about each school/district using the system
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Extends Supabase auth.users with application-specific user data
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'COUNSELOR')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(tenant_id, role);

-- ============================================================================
-- STUDENTS TABLE
-- ============================================================================
-- Stores student information for counseling interactions
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  needs_follow_up BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, student_id)
);

CREATE INDEX idx_students_tenant ON students(tenant_id);
CREATE INDEX idx_students_name ON students(tenant_id, last_name, first_name);
CREATE INDEX idx_students_grade ON students(tenant_id, grade_level);
CREATE INDEX idx_students_follow_up ON students(tenant_id, needs_follow_up) WHERE needs_follow_up = TRUE;

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================
-- Stores external contacts (parents, teachers, etc.)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  organization TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_name ON contacts(tenant_id, last_name, first_name);
CREATE INDEX idx_contacts_relationship ON contacts(tenant_id, relationship);

-- ============================================================================
-- REASON CATEGORIES TABLE
-- ============================================================================
-- Stores interaction reason categories (e.g., Academic, Behavioral, Social-Emotional)
CREATE TABLE reason_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_reason_categories_tenant ON reason_categories(tenant_id);
CREATE INDEX idx_reason_categories_sort ON reason_categories(tenant_id, sort_order);

-- ============================================================================
-- REASON SUBCATEGORIES TABLE
-- ============================================================================
-- Stores subcategories for each reason category
CREATE TABLE reason_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES reason_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reason_subcategories_category ON reason_subcategories(category_id);
CREATE INDEX idx_reason_subcategories_sort ON reason_subcategories(category_id, sort_order);

-- ============================================================================
-- INTERACTIONS TABLE
-- ============================================================================
-- Stores all counseling interactions with students or contacts
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES reason_categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES reason_subcategories(id) ON DELETE SET NULL,
  custom_reason TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  end_time TIMESTAMPTZ GENERATED ALWAYS AS (start_time + (duration_minutes || ' minutes')::INTERVAL) STORED,
  notes TEXT,
  needs_follow_up BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMPTZ,
  follow_up_notes TEXT,
  is_follow_up_complete BOOLEAN DEFAULT FALSE,
  follow_up_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (student_id IS NOT NULL OR contact_id IS NOT NULL),
  CHECK (NOT (student_id IS NOT NULL AND contact_id IS NOT NULL))
);

CREATE INDEX idx_interactions_tenant ON interactions(tenant_id);
CREATE INDEX idx_interactions_counselor ON interactions(tenant_id, counselor_id);
CREATE INDEX idx_interactions_student ON interactions(tenant_id, student_id);
CREATE INDEX idx_interactions_contact ON interactions(tenant_id, contact_id);
CREATE INDEX idx_interactions_time ON interactions(tenant_id, start_time DESC);
CREATE INDEX idx_interactions_category ON interactions(tenant_id, category_id);
CREATE INDEX idx_interactions_follow_up ON interactions(tenant_id, needs_follow_up, follow_up_date) 
  WHERE needs_follow_up = TRUE AND is_follow_up_complete = FALSE;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_students_updated_at 
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_updated_at 
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reason_categories_updated_at 
  BEFORE UPDATE ON reason_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reason_subcategories_updated_at 
  BEFORE UPDATE ON reason_subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_interactions_updated_at 
  BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for student interaction statistics
CREATE OR REPLACE VIEW student_stats AS
SELECT 
  s.id,
  s.tenant_id,
  s.student_id,
  s.first_name,
  s.last_name,
  s.grade_level,
  s.needs_follow_up,
  COUNT(i.id) AS interaction_count,
  COALESCE(SUM(i.duration_minutes), 0) AS total_time_minutes,
  MAX(i.start_time) AS last_interaction_date
FROM students s
LEFT JOIN interactions i ON s.id = i.student_id
GROUP BY s.id, s.tenant_id, s.student_id, s.first_name, s.last_name, s.grade_level, s.needs_follow_up;

-- View for contact interaction statistics
CREATE OR REPLACE VIEW contact_stats AS
SELECT 
  c.id,
  c.tenant_id,
  c.first_name,
  c.last_name,
  c.relationship,
  c.organization,
  COUNT(i.id) AS interaction_count,
  MAX(i.start_time) AS last_interaction_date
FROM contacts c
LEFT JOIN interactions i ON c.id = i.contact_id
GROUP BY c.id, c.tenant_id, c.first_name, c.last_name, c.relationship, c.organization;

-- View for pending follow-ups
CREATE OR REPLACE VIEW pending_follow_ups AS
SELECT 
  i.id,
  i.tenant_id,
  i.counselor_id,
  i.student_id,
  i.contact_id,
  i.start_time AS interaction_date,
  i.follow_up_date,
  i.follow_up_notes,
  CASE 
    WHEN i.follow_up_date < NOW() THEN TRUE 
    ELSE FALSE 
  END AS is_overdue,
  s.first_name AS student_first_name,
  s.last_name AS student_last_name,
  c.first_name AS contact_first_name,
  c.last_name AS contact_last_name
FROM interactions i
LEFT JOIN students s ON i.student_id = s.id
LEFT JOIN contacts c ON i.contact_id = c.id
WHERE i.needs_follow_up = TRUE 
  AND i.is_follow_up_complete = FALSE
ORDER BY i.follow_up_date ASC;
