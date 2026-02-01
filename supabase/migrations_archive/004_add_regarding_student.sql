-- Migration: Add "regarding_student_id" field for contact interactions
-- This allows contact interactions to reference which student the conversation was about

-- Add the regarding_student_id column to interactions table
ALTER TABLE interactions 
ADD COLUMN regarding_student_id UUID REFERENCES students(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_interactions_regarding_student ON interactions(tenant_id, regarding_student_id);

-- Add comment for documentation
COMMENT ON COLUMN interactions.regarding_student_id IS 'For contact interactions, references which student the conversation was about';

-- Update the constraint to allow contact interactions without a direct student_id
-- but they can still reference a student via regarding_student_id
ALTER TABLE interactions 
DROP CONSTRAINT IF EXISTS interactions_check;

-- Add updated constraint
ALTER TABLE interactions 
ADD CONSTRAINT interactions_check 
CHECK (
  (student_id IS NOT NULL AND contact_id IS NULL) OR 
  (student_id IS NULL AND contact_id IS NOT NULL)
);

-- Note: regarding_student_id can be used with contact interactions to indicate
-- which student the contact conversation was about, even though the interaction
-- is with the contact, not directly with the student.