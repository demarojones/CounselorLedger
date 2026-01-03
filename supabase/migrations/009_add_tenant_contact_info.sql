-- Add Contact Information to Tenants Table
-- This migration adds contact information fields to the tenants table
-- to support storing administrative contact details during initial setup

-- ============================================================================
-- ADD CONTACT INFORMATION FIELDS TO TENANTS TABLE
-- ============================================================================

-- Add contact information columns to tenants table
ALTER TABLE tenants 
ADD COLUMN contact_phone TEXT,
ADD COLUMN contact_address TEXT,
ADD COLUMN contact_email TEXT,
ADD COLUMN contact_person_name TEXT;

-- Add indexes for contact information (optional, for future search capabilities)
CREATE INDEX idx_tenants_contact_email ON tenants(contact_email) WHERE contact_email IS NOT NULL;
CREATE INDEX idx_tenants_contact_phone ON tenants(contact_phone) WHERE contact_phone IS NOT NULL;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN tenants.contact_phone IS 
  'Primary phone number for administrative contact';

COMMENT ON COLUMN tenants.contact_address IS 
  'Physical address of the school or district';

COMMENT ON COLUMN tenants.contact_email IS 
  'Primary email address for administrative contact';

COMMENT ON COLUMN tenants.contact_person_name IS 
  'Name of the primary administrative contact person';