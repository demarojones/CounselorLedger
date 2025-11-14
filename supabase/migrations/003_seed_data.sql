-- Seed Data Migration
-- This migration creates initial data for development and testing

-- ============================================================================
-- SAMPLE TENANT
-- ============================================================================

-- Create a sample school tenant
INSERT INTO tenants (id, name, subdomain, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo High School', 'demo-high', NOW(), NOW())
ON CONFLICT (subdomain) DO NOTHING;

-- ============================================================================
-- DEFAULT REASON CATEGORIES AND SUBCATEGORIES
-- ============================================================================

-- Insert default reason categories for the sample tenant
INSERT INTO reason_categories (id, tenant_id, name, color, sort_order, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Academic', '#3B82F6', 1, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Behavioral', '#EF4444', 2, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Social-Emotional', '#10B981', 3, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Career/College', '#8B5CF6', 4, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Crisis Intervention', '#F59E0B', 5, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Parent/Guardian Contact', '#06B6D4', 6, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Teacher Consultation', '#EC4899', 7, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Other', '#6B7280', 8, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert subcategories for Academic
INSERT INTO reason_subcategories (category_id, name, sort_order, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Course Selection', 1, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000001', 'Study Skills', 2, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000001', 'Grade Concerns', 3, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000001', 'Schedule Change', 4, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000001', 'Academic Planning', 5, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000001', 'Tutoring Referral', 6, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert subcategories for Behavioral
INSERT INTO reason_subcategories (category_id, name, sort_order, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000002', 'Classroom Disruption', 1, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'Attendance Issues', 2, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'Conflict Resolution', 3, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'Disciplinary Follow-up', 4, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'Peer Mediation', 5, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert subcategories for Social-Emotional
INSERT INTO reason_subcategories (category_id, name, sort_order, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000003', 'Anxiety/Stress', 1, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'Depression', 2, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'Peer Relationships', 3, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'Family Issues', 4, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'Self-Esteem', 5, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'Grief/Loss', 6, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'Anger Management', 7, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert subcategories for Career/College
INSERT INTO reason_subcategories (category_id, name, sort_order, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000004', 'College Applications', 1, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', 'Career Exploration', 2, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', 'Financial Aid', 3, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', 'Scholarship Information', 4, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', 'Resume/Interview Prep', 5, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', 'Post-Secondary Planning', 6, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert subcategories for Crisis Intervention
INSERT INTO reason_subcategories (category_id, name, sort_order, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000005', 'Safety Concern', 1, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000005', 'Self-Harm', 2, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000005', 'Suicidal Ideation', 3, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000005', 'Substance Abuse', 4, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000005', 'Trauma Response', 5, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000005', 'Emergency Referral', 6, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert subcategories for Parent/Guardian Contact
INSERT INTO reason_subcategories (category_id, name, sort_order, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000006', 'Progress Update', 1, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000006', 'Concern Discussion', 2, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000006', 'IEP/504 Meeting', 3, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000006', 'Parent Request', 4, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000006', 'Collaborative Planning', 5, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert subcategories for Teacher Consultation
INSERT INTO reason_subcategories (category_id, name, sort_order, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000007', 'Student Concern', 1, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000007', 'Classroom Strategies', 2, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000007', 'Accommodation Discussion', 3, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000007', 'Behavioral Support', 4, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000007', 'Team Meeting', 5, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert subcategories for Other
INSERT INTO reason_subcategories (category_id, name, sort_order, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000008', 'Administrative', 1, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000008', 'Documentation', 2, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000008', 'Custom', 3, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tenants IS 
  'Sample tenant created for development and testing purposes';

COMMENT ON TABLE reason_categories IS 
  'Default reason categories that can be customized by each tenant';

COMMENT ON TABLE reason_subcategories IS 
  'Default subcategories providing detailed classification of interactions';
