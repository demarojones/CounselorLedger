/**
 * Setup Service
 *
 * Handles initial system setup including setup token validation,
 * tenant creation, and first admin user creation.
 */

import { supabase } from './supabase';
import { handleSupabaseError, type SupabaseResponse } from './supabaseHelpers';
import { sendSetupConfirmationEmail } from './emailService';
import {
  generateSecureTokenWithMetadata,
  hashTokenSecurely,
  verifyTokenHash,
  validateTokenSecurity,
} from '@/utils/tokenSecurity';
import type {
  SetupToken,
  SetupTokenDbResponse,
  SetupTokenValidation,
  TenantSetupData,
  SetupResult,
} from '@/types/setup';
import type { User } from '@/types/user';

/**
 * Generate a cryptographically secure random token with enhanced security
 */
function generateSecureToken(): string {
  const { token } = generateSecureTokenWithMetadata();
  return token;
}

/**
 * Hash a token for secure storage using enhanced security
 */
async function hashToken(token: string): Promise<string> {
  return await hashTokenSecurely(token);
}

/**
 * Validate a setup token and return its details
 */
export async function validateSetupToken(
  token: string
): Promise<SupabaseResponse<SetupTokenValidation>> {
  try {
    if (!token || token.trim().length === 0) {
      return {
        data: { isValid: false, error: 'Token is required' },
        error: null,
      };
    }

    // Validate token cryptographic strength
    const securityValidation = validateTokenSecurity(token);
    if (!securityValidation.isValid) {
      return {
        data: { isValid: false, error: 'Invalid token format' },
        error: null,
      };
    }

    if (!securityValidation.isSecure) {
      console.warn('Setup token security warning:', securityValidation.error);
      // Log security event but don't reject - could be legitimate older token
    }

    // Get all setup tokens and verify using secure comparison
    const { data: setupTokens, error } = await supabase
      .from('setup_tokens')
      .select('*')
      .is('used_at', null);

    if (error) {
      return {
        data: { isValid: false, error: 'Failed to validate token' },
        error: handleSupabaseError(error),
      };
    }

    // Find matching setup token using secure token verification
    let matchingToken = null;
    for (const st of setupTokens || []) {
      if (await verifyTokenHash(token, st.token)) {
        matchingToken = st;
        break;
      }
    }

    if (!matchingToken) {
      return {
        data: { isValid: false, error: 'Invalid or expired setup token' },
        error: null,
      };
    }

    const setupToken = convertSetupTokenFromDb(matchingToken);

    // Check if token is expired
    if (setupToken.expiresAt < new Date()) {
      return {
        data: { isValid: false, error: 'Setup token has expired' },
        error: null,
      };
    }

    return {
      data: {
        isValid: true,
        tenantName: setupToken.tenantName,
        adminEmail: setupToken.adminEmail,
        expiresAt: setupToken.expiresAt,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: { isValid: false, error: 'Failed to validate token' },
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate setup token',
      },
    };
  }
}

/**
 * Create a new tenant and admin user atomically
 */
export async function createTenantAndAdmin(
  token: string,
  setupData: TenantSetupData
): Promise<SupabaseResponse<SetupResult>> {
  try {
    // First validate the token
    const tokenValidation = await validateSetupToken(token);
    if (tokenValidation.error || !tokenValidation.data?.isValid) {
      return {
        data: {
          success: false,
          error: tokenValidation.data?.error || 'Invalid setup token',
        },
        error: tokenValidation.error,
      };
    }

    // Validate that the setup data matches the token
    if (
      setupData.tenantName !== tokenValidation.data.tenantName ||
      setupData.adminEmail !== tokenValidation.data.adminEmail
    ) {
      return {
        data: {
          success: false,
          error: 'Setup data does not match the setup token',
        },
        error: null,
      };
    }

    // Check if subdomain is unique
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', setupData.subdomain)
      .single();

    if (existingTenant) {
      return {
        data: {
          success: false,
          error: 'Subdomain is already taken',
        },
        error: null,
      };
    }

    // Step 1: Create Supabase Auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: setupData.adminEmail,
      password: setupData.adminPassword,
      options: {
        data: {
          first_name: setupData.adminFirstName,
          last_name: setupData.adminLastName,
          role: 'ADMIN',
        },
      },
    });

    if (authError) {
      return {
        data: {
          success: false,
          error: 'Failed to create authentication account: ' + authError.message,
        },
        error: {
          code: 'AUTH_ERROR',
          message: authError.message,
        },
      };
    }

    if (!authData.user) {
      return {
        data: {
          success: false,
          error: 'Failed to create authentication account',
        },
        error: {
          code: 'AUTH_ERROR',
          message: 'No user returned from auth signup',
        },
      };
    }

    // Step 2: Create tenant and application user record using the auth user ID
    // Find the setup token using secure token verification
    const { data: setupTokens } = await supabase
      .from('setup_tokens')
      .select('*')
      .is('used_at', null);

    let matchingToken = null;
    for (const st of setupTokens || []) {
      if (await verifyTokenHash(token, st.token)) {
        matchingToken = st;
        break;
      }
    }

    if (!matchingToken) {
      console.error('No matching setup token found during tenant creation');
      return {
        data: {
          success: false,
          error: 'Invalid setup token',
        },
        error: null,
      };
    }

    const { data: result, error } = await supabase.rpc('complete_initial_setup', {
      p_token: matchingToken.token, // Use the stored hash directly
      p_auth_user_id: authData.user.id,
      p_tenant_name: setupData.tenantName,
      p_subdomain: setupData.subdomain,
      p_admin_email: setupData.adminEmail,
      p_admin_first_name: setupData.adminFirstName,
      p_admin_last_name: setupData.adminLastName,
      p_contact_phone: setupData.contactPhone || null,
      p_contact_address: setupData.contactAddress || null,
      p_contact_email: setupData.contactEmail || null,
      p_contact_person_name: setupData.contactPersonName || null,
    });

    if (error) {
      // If application setup fails, we should clean up the auth user
      // However, Supabase doesn't provide a way to delete auth users from client
      // So we log the error and return failure
      console.error('Failed to complete setup after auth user creation:', error);
      return {
        data: {
          success: false,
          error: 'Failed to complete initial setup. Please contact support.',
        },
        error: handleSupabaseError(error),
      };
    }

    if (!result || !result.success) {
      // Same issue - auth user was created but setup failed
      console.error('Setup failed after auth user creation:', result?.error);
      return {
        data: {
          success: false,
          error: result?.error || 'Setup failed. Please contact support.',
        },
        error: null,
      };
    }

    return {
      data: {
        success: true,
        tenant: {
          id: result.tenant_id,
          name: setupData.tenantName,
          subdomain: setupData.subdomain,
        },
        user: {
          id: result.user_id,
          email: setupData.adminEmail,
          firstName: setupData.adminFirstName,
          lastName: setupData.adminLastName,
          role: 'ADMIN',
        },
      },
      error: null,
    };
  } catch (error) {
    return {
      data: {
        success: false,
        error: 'Failed to complete initial setup',
      },
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create tenant and admin',
      },
    };
  }
}

/**
 * Complete the initial setup process
 * This is a convenience method that combines token validation and tenant/admin creation
 */
export async function completeInitialSetup(
  token: string,
  setupData: TenantSetupData
): Promise<SupabaseResponse<User>> {
  try {
    const result = await createTenantAndAdmin(token, setupData);

    if (result.error || !result.data?.success) {
      return {
        data: null,
        error: result.error || {
          code: 'SETUP_ERROR',
          message: result.data?.error || 'Setup failed',
        },
      };
    }

    // Automatically sign in the admin user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: setupData.adminEmail,
      password: setupData.adminPassword,
    });

    if (signInError) {
      // Setup was successful but auto-login failed
      // This is not a critical error - user can manually log in
      console.warn('Auto-login failed after setup:', signInError);
    }

    // Return the created user
    const user: User = {
      id: result.data.user!.id,
      email: result.data.user!.email,
      firstName: result.data.user!.firstName,
      lastName: result.data.user!.lastName,
      role: result.data.user!.role,
      tenantId: result.data.tenant!.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Send setup confirmation email
    const dashboardUrl = `${window.location.origin}/dashboard`;
    const adminName = `${setupData.adminFirstName} ${setupData.adminLastName}`;

    const emailResult = await sendSetupConfirmationEmail({
      to: setupData.adminEmail,
      tenantName: setupData.tenantName,
      adminName,
      dashboardUrl,
    });

    // Log email sending result but don't fail the setup if email fails
    if (emailResult.error || !emailResult.data?.success) {
      console.warn(
        'Failed to send setup confirmation email:',
        emailResult.error?.message || emailResult.data?.error
      );
    }

    return {
      data: user,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to complete initial setup',
      },
    };
  }
}

/**
 * Create a new setup token (for administrative use)
 */
export async function createSetupToken(
  tenantName: string,
  tenantSubdomain: string,
  adminEmail: string,
  expirationHours: number = 24
): Promise<SupabaseResponse<{ token: string; hashedToken: string }>> {
  try {
    const token = generateSecureToken();
    const hashedToken = await hashToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const { error } = await supabase.from('setup_tokens').insert({
      token: hashedToken,
      tenant_name: tenantName,
      tenant_subdomain: tenantSubdomain,
      admin_email: adminEmail,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return {
      data: { token, hashedToken },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create setup token',
      },
    };
  }
}

// ============================================================================
// DATA CONVERSION HELPERS
// ============================================================================

function convertSetupTokenFromDb(dbToken: SetupTokenDbResponse): SetupToken {
  return {
    id: dbToken.id,
    token: dbToken.token,
    tenantName: dbToken.tenant_name,
    tenantSubdomain: dbToken.tenant_subdomain,
    adminEmail: dbToken.admin_email,
    expiresAt: new Date(dbToken.expires_at),
    usedAt: dbToken.used_at ? new Date(dbToken.used_at) : undefined,
    createdAt: new Date(dbToken.created_at),
    updatedAt: new Date(dbToken.updated_at),
  };
}
