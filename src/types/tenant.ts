// Tenant types
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database response types for Supabase
export interface TenantDbResponse {
  id: string;
  name: string;
  subdomain: string;
  created_at: string;
  updated_at: string;
}
