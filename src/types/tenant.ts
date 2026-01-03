// Tenant types
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  contactPhone?: string;
  contactAddress?: string;
  contactEmail?: string;
  contactPersonName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database response types for Supabase
export interface TenantDbResponse {
  id: string;
  name: string;
  subdomain: string;
  contact_phone?: string;
  contact_address?: string;
  contact_email?: string;
  contact_person_name?: string;
  created_at: string;
  updated_at: string;
}
