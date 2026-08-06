-- ============================================================================
-- Migration: Make student_id optional with auto-generation
-- ============================================================================
-- The student_id field (school-assigned external identifier) is not always
-- available. This migration makes it nullable and sets up a trigger to
-- auto-generate a unique identifier when one is not provided.
--
-- Format: STU-XXXXXXXX (8 random alphanumeric characters)
-- Record uniqueness is guaranteed by the UUID primary key (id column).
-- The UNIQUE(tenant_id, student_id) constraint still applies for non-null values.
-- ============================================================================

-- Step 1: Allow student_id to be NULL
ALTER TABLE students ALTER COLUMN student_id DROP NOT NULL;

-- Step 2: Create a function to auto-generate student_id if not provided
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER AS $$
DECLARE
  new_id TEXT;
  chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  i INT;
BEGIN
  -- Only generate if student_id is NULL or empty
  IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
    LOOP
      new_id := 'STU-';
      FOR i IN 1..8 LOOP
        new_id := new_id || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      
      -- Check for uniqueness within the tenant
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM students 
        WHERE tenant_id = NEW.tenant_id AND student_id = new_id
      );
    END LOOP;
    
    NEW.student_id := new_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to run before insert
DROP TRIGGER IF EXISTS trg_generate_student_id ON students;
CREATE TRIGGER trg_generate_student_id
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION generate_student_id();

-- Step 4: Update the unique constraint to use a partial index for non-null values
-- Drop the old constraint and replace with a partial unique index
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_tenant_id_student_id_key;

-- Create a unique index that only applies to non-null student_id values
CREATE UNIQUE INDEX idx_students_tenant_student_id 
  ON students(tenant_id, student_id) 
  WHERE student_id IS NOT NULL;

-- Step 5: Add a comment documenting the behavior
COMMENT ON COLUMN students.student_id IS 
  'School-assigned external student identifier. Auto-generated in STU-XXXXXXXX format if not provided.';
