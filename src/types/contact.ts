// Contact types
export type ContactRelationship =
  | 'Parent'
  | 'Guardian'
  | 'Teacher'
  | 'Administrator'
  | 'Counselor'
  | 'Social Worker'
  | 'Other';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Computed fields
  interactionCount?: number;
}

// Database response types for Supabase
export interface ContactDbResponse {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
