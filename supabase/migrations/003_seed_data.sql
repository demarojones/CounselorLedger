-- Seed Data Migration
-- This migration adds default reason categories and subcategories for new tenants

-- Note: This seed data is for the default tenant only
-- When creating new tenants, you should insert similar categories for each tenant

-- Insert default tenant (for development/testing)
INSERT INTO tenants (id, name, subdomain) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Mayfield Elementary School',
  'mayfield-elementary'
) ON CONFLICT (subdomain) DO NOTHING;

-- ============================================================================
-- DEFAULT REASON CATEGORIES
-- ============================================================================

INSERT INTO reason_categories (tenant_id, name, color, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Academic', '#3B82F6', 1),
  ('00000000-0000-0000-0000-000000000001', 'Behavioral', '#EF4444', 2),
  ('00000000-0000-0000-0000-000000000001', 'Social-Emotional', '#10B981', 3),
  ('00000000-0000-0000-0000-000000000001', 'Career/College', '#8B5CF6', 4),
  ('00000000-0000-0000-0000-000000000001', 'Crisis Intervention', '#F97316', 5),
  ('00000000-0000-0000-0000-000000000001', 'Parent/Guardian Contact', '#06B6D4', 6),
  ('00000000-0000-0000-0000-000000000001', 'Teacher Consultation', '#EC4899', 7),
  ('00000000-0000-0000-0000-000000000001', 'Other', '#6B7280', 8)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ============================================================================
-- DEFAULT REASON SUBCATEGORIES
-- ============================================================================

-- Academic subcategories
INSERT INTO reason_subcategories (category_id, name, sort_order)
SELECT rc.id, subs.subcategory, subs.sub_sort_order 
FROM reason_categories rc, 
  (VALUES 
    ('Course Selection', 1),
    ('Study Skills', 2),
    ('Academic Planning', 3),
    ('Grade Concerns', 4),
    ('Test Anxiety', 5),
    ('Learning Difficulties', 6)
  ) AS subs(subcategory, sub_sort_order)
WHERE rc.tenant_id = '00000000-0000-0000-0000-000000000001' AND rc.name = 'Academic'
ON CONFLICT DO NOTHING;

-- Behavioral subcategories
INSERT INTO reason_subcategories (category_id, name, sort_order)
SELECT rc.id, subs.subcategory, subs.sub_sort_order 
FROM reason_categories rc,
  (VALUES
    ('Classroom Disruption', 1),
    ('Attendance Issues', 2),
    ('Conflict Resolution', 3),
    ('Bullying', 4),
    ('Anger Management', 5),
    ('Peer Relationships', 6)
  ) AS subs(subcategory, sub_sort_order)
WHERE rc.tenant_id = '00000000-0000-0000-0000-000000000001' AND rc.name = 'Behavioral'
ON CONFLICT DO NOTHING;

-- Social-Emotional subcategories
INSERT INTO reason_subcategories (category_id, name, sort_order)
SELECT rc.id, subs.subcategory, subs.sub_sort_order 
FROM reason_categories rc,
  (VALUES
    ('Anxiety', 1),
    ('Depression', 2),
    ('Self-Esteem', 3),
    ('Grief/Loss', 4),
    ('Stress Management', 5),
    ('Social Skills', 6),
    ('Family Issues', 7)
  ) AS subs(subcategory, sub_sort_order)
WHERE rc.tenant_id = '00000000-0000-0000-0000-000000000001' AND rc.name = 'Social-Emotional'
ON CONFLICT DO NOTHING;

-- Career/College subcategories
INSERT INTO reason_subcategories (category_id, name, sort_order)
SELECT rc.id, subs.subcategory, subs.sub_sort_order 
FROM reason_categories rc,
  (VALUES
    ('College Applications', 1),
    ('Career Exploration', 2),
    ('Financial Aid', 3),
    ('Resume/Interview Prep', 4),
    ('Post-Secondary Planning', 5),
    ('Scholarship Information', 6)
  ) AS subs(subcategory, sub_sort_order)
WHERE rc.tenant_id = '00000000-0000-0000-0000-000000000001' AND rc.name = 'Career/College'
ON CONFLICT DO NOTHING;

-- Crisis Intervention subcategories
INSERT INTO reason_subcategories (category_id, name, sort_order)
SELECT rc.id, subs.subcategory, subs.sub_sort_order 
FROM reason_categories rc,
  (VALUES
    ('Suicide Risk', 1),
    ('Self-Harm', 2),
    ('Substance Abuse', 3),
    ('Trauma', 4),
    ('Safety Concern', 5),
    ('Emergency Referral', 6)
  ) AS subs(subcategory, sub_sort_order)
WHERE rc.tenant_id = '00000000-0000-0000-0000-000000000001' AND rc.name = 'Crisis Intervention'
ON CONFLICT DO NOTHING;

-- Parent/Guardian Contact subcategories
INSERT INTO reason_subcategories (category_id, name, sort_order)
SELECT rc.id, subs.subcategory, subs.sub_sort_order 
FROM reason_categories rc,
  (VALUES
    ('Progress Update', 1),
    ('Behavior Concern', 2),
    ('Academic Concern', 3),
    ('Parent Request', 4),
    ('Conference', 5),
    ('Follow-up', 6)
  ) AS subs(subcategory, sub_sort_order)
WHERE rc.tenant_id = '00000000-0000-0000-0000-000000000001' AND rc.name = 'Parent/Guardian Contact'
ON CONFLICT DO NOTHING;

-- Teacher Consultation subcategories
INSERT INTO reason_subcategories (category_id, name, sort_order)
SELECT rc.id, subs.subcategory, subs.sub_sort_order 
FROM reason_categories rc,
  (VALUES
    ('Student Concern', 1),
    ('Classroom Strategies', 2),
    ('Accommodation Discussion', 3),
    ('Behavioral Support', 4),
    ('Academic Support', 5),
    ('Collaboration', 6)
  ) AS subs(subcategory, sub_sort_order)
WHERE rc.tenant_id = '00000000-0000-0000-0000-000000000001' AND rc.name = 'Teacher Consultation'
ON CONFLICT DO NOTHING;

-- Other subcategories
INSERT INTO reason_subcategories (category_id, name, sort_order)
SELECT rc.id, subs.subcategory, subs.sub_sort_order 
FROM reason_categories rc,
  (VALUES
    ('General Check-in', 1),
    ('Administrative', 2),
    ('Documentation', 3),
    ('Other', 4)
  ) AS subs(subcategory, sub_sort_order)
WHERE rc.tenant_id = '00000000-0000-0000-0000-000000000001' AND rc.name = 'Other'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE reason_categories IS 
  'Default categories are provided for demo tenant. Create similar categories for each new tenant.';

COMMENT ON TABLE reason_subcategories IS 
  'Default subcategories are provided for demo tenant. Customize for each tenant as needed.';
