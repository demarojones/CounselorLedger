// Setup and Invitation types for initial system setup and user onboarding

// ============================================================================
// SETUP TOKEN TYPES
// ============================================================================

export interface SetupToken {
  id: string;
  token: string;
  tenantName: string;
  tenantSubdomain: string;
  adminEmail: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Database response type for Supabase
export interface SetupTokenDbResponse {
  id: string;
  token: string;
  tenant_name: string;
  tenant_subdomain: string;
  admin_email: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
  updated_at: string;
}

// Setup token validation result
export interface SetupTokenValidation {
  isValid: boolean;
  tenantName?: string;
  adminEmail?: string;
  expiresAt?: Date;
  error?: string;
}

// Setup token status from view
export type SetupTokenStatus = 'ACTIVE' | 'EXPIRED' | 'USED';

export interface SetupTokenStatusView {
  id: string;
  token: string;
  tenantName: string;
  tenantSubdomain: string;
  adminEmail: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  status: SetupTokenStatus;
}

// ============================================================================
// INVITATION TYPES
// ============================================================================

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'ADMIN' | 'COUNSELOR';
  invitedBy: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Database response type for Supabase
export interface InvitationDbResponse {
  id: string;
  tenant_id: string;
  email: string;
  role: 'ADMIN' | 'COUNSELOR';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

// Invitation validation result
export interface InvitationValidation {
  isValid: boolean;
  email?: string;
  role?: 'ADMIN' | 'COUNSELOR';
  tenantId?: string;
  expiresAt?: Date;
  error?: string;
}

// Pending invitation view with additional information
export interface PendingInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'ADMIN' | 'COUNSELOR';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  invitedByFirstName: string;
  invitedByLastName: string;
  invitedByEmail: string;
  tenantName: string;
  isExpired: boolean;
}

// Database response for pending invitations view
export interface PendingInvitationDbResponse {
  id: string;
  tenant_id: string;
  email: string;
  role: 'ADMIN' | 'COUNSELOR';
  token: string;
  expires_at: string;
  created_at: string;
  invited_by_first_name: string;
  invited_by_last_name: string;
  invited_by_email: string;
  tenant_name: string;
  is_expired: boolean;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

// Form data for tenant setup during initial setup
export interface TenantSetupData {
  tenantName: string;
  subdomain: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  contactPhone?: string;
  contactAddress?: string;
  contactEmail?: string;
  contactPersonName?: string;
}

// Form data for creating user invitations
export interface InvitationFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'COUNSELOR';
}

// Form data for user registration via invitation
export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

// ============================================================================
// SERVICE RESULT TYPES
// ============================================================================

// Result of setup completion
export interface SetupResult {
  success: boolean;
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
  };
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'COUNSELOR';
  };
  error?: string;
}

// Result of invitation creation
export interface InvitationResult {
  success: boolean;
  invitation?: Invitation;
  error?: string;
}

// Result of invitation acceptance
export interface AcceptanceResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'COUNSELOR';
    tenantId: string;
  };
  autoLoginSuccess?: boolean;
  error?: string;
}
