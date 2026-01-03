/**
 * Invitation Service
 *
 * Handles user invitation lifecycle including creation, validation,
 * acceptance, and management operations.
 */

import { supabase } from './supabase';
import { getTenantContext, handleSupabaseError, type SupabaseResponse } from './supabaseHelpers';
import { sendInvitationEmail } from './emailService';
import { rateLimiter } from '@/utils/rateLimiter';
import { getClientIdentifier } from '@/utils/clientInfo';
import {
  generateSecureTokenWithMetadata,
  hashTokenSecurely,
  verifyTokenHash,
  validateTokenSecurity,
} from '@/utils/tokenSecurity';
import {
  logInvitationEvent,
  logRateLimitEvent,
  logTokenManipulation,
  logAuthFailure,
} from './securityEventService';
import type {
  Invitation,
  InvitationDbResponse,
  InvitationValidation,
  InvitationFormData,
  UserRegistrationData,
  InvitationResult,
  AcceptanceResult,
  PendingInvitation,
  PendingInvitationDbResponse,
} from '@/types/setup';

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
 * Create a new user invitation
 */
export async function createInvitation(
  invitationData: InvitationFormData
): Promise<SupabaseResponse<InvitationResult>> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        data: {
          success: false,
          error: 'User not authenticated',
        },
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    // Apply rate limiting
    const clientId = getClientIdentifier();
    const rateLimitResult = rateLimiter.checkCombinedLimit(clientId, context.userId);

    if (!rateLimitResult.allowed) {
      // Log rate limiting event
      await logRateLimitEvent(clientId, context.userId, {
        email: invitationData.email,
        rateLimitType: 'invitation_creation',
        resetTime: rateLimitResult.resetTime,
      });

      return {
        data: {
          success: false,
          error: rateLimitResult.error || 'Rate limit exceeded. Please try again later.',
        },
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitResult.error || 'Rate limit exceeded',
        },
      };
    }

    // Check if user already exists in this tenant
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('email', invitationData.email)
      .single();

    if (existingUser) {
      // Log duplicate email attempt
      await logInvitationEvent('DUPLICATE_EMAIL_ATTEMPT', 'LOW', invitationData.email, {
        tenantId: context.tenantId,
        attemptedBy: context.userId,
      });

      return {
        data: {
          success: false,
          error: 'User with this email already exists in your organization',
        },
        error: null,
      };
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('email', invitationData.email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      return {
        data: {
          success: false,
          error: 'A pending invitation already exists for this email address',
        },
        error: null,
      };
    }

    // Generate secure token and set expiration (7 days from now)
    const token = generateSecureToken();
    const hashedToken = await hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const insertData = {
      tenant_id: context.tenantId,
      email: invitationData.email,
      role: invitationData.role,
      invited_by: context.userId,
      token: hashedToken,
      expires_at: expiresAt.toISOString(),
    };

    const { data, error } = await supabase.from('invitations').insert(insertData).select().single();

    if (error) {
      // Log invitation creation failure
      await logInvitationEvent('INVITATION_FAILED', 'MEDIUM', invitationData.email, {
        error: error.message,
        tenantId: context.tenantId,
        invitedBy: context.userId,
      });

      return {
        data: {
          success: false,
          error: 'Failed to create invitation',
        },
        error: handleSupabaseError(error),
      };
    }

    const invitation = convertInvitationFromDb(data);

    // Log successful invitation creation
    await logInvitationEvent('INVITATION_CREATED', 'LOW', invitationData.email, {
      invitationId: invitation.id,
      role: invitationData.role,
      tenantId: context.tenantId,
      invitedBy: context.userId,
      expiresAt: invitation.expiresAt.toISOString(),
    });

    // Send invitation email
    const invitationUrl = `${window.location.origin}/invite/${token}`;
    const expirationDate = expiresAt.toLocaleDateString();

    // Get inviter information for the email
    const { data: inviterData } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', context.userId)
      .single();

    const inviterName = inviterData
      ? `${inviterData.first_name} ${inviterData.last_name}`
      : 'Your administrator';

    // Get tenant information for the email
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', context.tenantId)
      .single();

    const tenantName = tenantData?.name || 'Your organization';

    const emailResult = await sendInvitationEmail({
      to: invitationData.email,
      tenantName,
      inviterName,
      role: invitationData.role,
      invitationUrl,
      expirationDate,
      adminEmail: inviterData
        ? `${inviterData.first_name.toLowerCase()}.${inviterData.last_name.toLowerCase()}@${tenantName.toLowerCase().replace(/\s+/g, '')}.com`
        : 'admin@example.com',
    });

    // Log email sending result but don't fail the invitation creation if email fails
    if (emailResult.error || !emailResult.data?.success) {
      console.warn(
        'Failed to send invitation email:',
        emailResult.error?.message || emailResult.data?.error
      );
    }

    return {
      data: {
        success: true,
        invitation,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: {
        success: false,
        error: 'Failed to create invitation',
      },
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create invitation',
      },
    };
  }
}

/**
 * Validate an invitation token and return its details
 */
export async function validateInvitationToken(
  token: string
): Promise<SupabaseResponse<InvitationValidation>> {
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
      // Log token manipulation attempt
      await logTokenManipulation(undefined, {
        token: token.substring(0, 10) + '...', // Log partial token for debugging
        reason: 'Invalid token format',
        securityValidation,
      });

      return {
        data: { isValid: false, error: 'Invalid token format' },
        error: null,
      };
    }

    if (!securityValidation.isSecure) {
      console.warn('Token security warning:', securityValidation.error);
      // Log security event but don't reject - could be legitimate older token
      await logTokenManipulation(undefined, {
        token: token.substring(0, 10) + '...', // Log partial token for debugging
        reason: 'Weak token security',
        securityValidation,
      });
    }

    // Get all invitations and verify using secure comparison
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .is('accepted_at', null);

    if (error) {
      return {
        data: { isValid: false, error: 'Failed to validate token' },
        error: handleSupabaseError(error),
      };
    }

    // Find matching invitation using secure token verification
    let matchingInvitation = null;
    for (const inv of invitations || []) {
      if (await verifyTokenHash(token, inv.token)) {
        matchingInvitation = inv;
        break;
      }
    }

    if (!matchingInvitation) {
      // Log invalid token access attempt
      await logInvitationEvent('INVALID_TOKEN_ACCESS', 'MEDIUM', 'unknown', {
        token: token.substring(0, 10) + '...', // Log partial token for debugging
        reason: 'No matching invitation found',
      });

      return {
        data: { isValid: false, error: 'Invalid or expired invitation token' },
        error: null,
      };
    }

    const invitation = convertInvitationFromDb(matchingInvitation);

    // Check if token is expired
    if (invitation.expiresAt < new Date()) {
      // Log expired invitation access
      await logInvitationEvent('INVITATION_EXPIRED', 'LOW', invitation.email, {
        invitationId: invitation.id,
        expiresAt: invitation.expiresAt.toISOString(),
        accessedAt: new Date().toISOString(),
      });

      return {
        data: { isValid: false, error: 'Invitation has expired' },
        error: null,
      };
    }

    return {
      data: {
        isValid: true,
        email: invitation.email,
        role: invitation.role,
        tenantId: invitation.tenantId,
        expiresAt: invitation.expiresAt,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: { isValid: false, error: 'Failed to validate token' },
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate invitation token',
      },
    };
  }
}

/**
 * Accept an invitation and create a new user account
 *
 * This function follows the proper order:
 * 1. Validate invitation token
 * 2. Create Supabase Auth account first
 * 3. Create application user record after auth success using the auth user ID
 * 4. Automatically log in the user
 */
export async function acceptInvitation(
  token: string,
  userData: UserRegistrationData
): Promise<SupabaseResponse<AcceptanceResult>> {
  try {
    // First validate the token
    const tokenValidation = await validateInvitationToken(token);
    if (tokenValidation.error || !tokenValidation.data?.isValid) {
      return {
        data: {
          success: false,
          error: tokenValidation.data?.error || 'Invalid invitation token',
        },
        error: tokenValidation.error,
      };
    }

    const validationData = tokenValidation.data;

    // Step 1: Create Supabase Auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validationData.email!,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: validationData.role,
          tenant_id: validationData.tenantId,
        },
      },
    });

    if (authError) {
      // Log authentication failure
      await logAuthFailure(validationData.email, {
        error: authError.message,
        step: 'auth_signup',
        tenantId: validationData.tenantId,
      });

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

    // Step 2: Create application user record after auth success using the auth user ID
    // Find the invitation using secure token verification
    const { data: invitations } = await supabase
      .from('invitations')
      .select('*')
      .is('accepted_at', null);

    let matchingInvitation = null;
    for (const inv of invitations || []) {
      if (await verifyTokenHash(token, inv.token)) {
        matchingInvitation = inv;
        break;
      }
    }

    if (!matchingInvitation) {
      console.error('No matching invitation found during acceptance');
      return {
        data: {
          success: false,
          error: 'Invalid invitation token',
        },
        error: null,
      };
    }

    const { data: result, error: dbError } = await supabase.rpc('accept_invitation', {
      p_token: matchingInvitation.token, // Use the stored hash directly
      p_auth_user_id: authData.user.id,
      p_first_name: userData.firstName,
      p_last_name: userData.lastName,
    });

    if (dbError) {
      // If application user creation fails, we should clean up the auth user
      // However, Supabase doesn't provide a way to delete auth users from client
      // So we log the error and return failure
      console.error('Failed to create application user after auth success:', dbError);
      return {
        data: {
          success: false,
          error: 'Failed to complete account setup. Please contact support.',
        },
        error: handleSupabaseError(dbError),
      };
    }

    if (!result || !result.success) {
      // Same issue - auth user was created but app user failed
      console.error('Application user creation failed:', result?.error);

      // Log invitation acceptance failure
      await logInvitationEvent('INVITATION_FAILED', 'HIGH', validationData.email || 'unknown', {
        error: result?.error || 'Application user creation failed',
        step: 'app_user_creation',
        authUserId: authData.user.id,
        tenantId: validationData.tenantId,
      });

      return {
        data: {
          success: false,
          error: result?.error || 'Account setup failed. Please contact support.',
        },
        error: null,
      };
    }

    // Log successful invitation acceptance
    await logInvitationEvent('INVITATION_ACCEPTED', 'LOW', validationData.email || 'unknown', {
      userId: result.user_id,
      role: validationData.role,
      tenantId: validationData.tenantId,
      firstName: userData.firstName,
      lastName: userData.lastName,
    });

    // Step 3: Automatically sign in the user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: validationData.email!,
      password: userData.password,
    });

    if (signInError) {
      // User was created successfully but auto-login failed
      // This is not a critical error - user can manually log in
      console.warn('Auto-login failed after registration:', signInError);
    }

    return {
      data: {
        success: true,
        user: {
          id: result.user_id,
          email: validationData.email!,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: validationData.role!,
          tenantId: validationData.tenantId!,
        },
        autoLoginSuccess: !signInError,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: {
        success: false,
        error: 'Failed to accept invitation',
      },
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to accept invitation',
      },
    };
  }
}

/**
 * Get all pending invitations for the current tenant
 */
export async function getPendingInvitations(): Promise<SupabaseResponse<PendingInvitation[]>> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    const { data, error } = await supabase
      .from('pending_invitations')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const invitations = (data || []).map(convertPendingInvitationFromDb);
    return { data: invitations, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch pending invitations',
      },
    };
  }
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(invitationId: string): Promise<SupabaseResponse<null>> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)
      .eq('tenant_id', context.tenantId)
      .is('accepted_at', null);

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    // Log invitation cancellation
    await logInvitationEvent('INVITATION_CANCELLED', 'LOW', 'unknown', {
      invitationId,
      cancelledBy: context.userId,
      tenantId: context.tenantId,
    });

    return { data: null, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel invitation',
      },
    };
  }
}

/**
 * Resend an invitation (creates a new token with extended expiration)
 */
export async function resendInvitation(
  invitationId: string
): Promise<SupabaseResponse<{ token: string }>> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    // Apply rate limiting for resend operations (more restrictive)
    const clientId = getClientIdentifier();
    const resendRateLimitResult = rateLimiter.checkCombinedLimit(
      clientId,
      context.userId,
      { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 resends per 15 minutes per IP
      { windowMs: 60 * 60 * 1000, maxRequests: 10 } // 10 resends per hour per user
    );

    if (!resendRateLimitResult.allowed) {
      // Log rate limiting for resend
      await logRateLimitEvent(clientId, context.userId, {
        operation: 'invitation_resend',
        invitationId,
        resetTime: resendRateLimitResult.resetTime,
      });

      return {
        data: null,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: resendRateLimitResult.error || 'Resend rate limit exceeded',
        },
      };
    }

    // Generate new token and expiration
    const token = generateSecureToken();
    const hashedToken = await hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
      .from('invitations')
      .update({
        token: hashedToken,
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', invitationId)
      .eq('tenant_id', context.tenantId)
      .is('accepted_at', null);

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    // Get invitation details for email sending
    const { data: invitationData } = await supabase
      .from('invitations')
      .select(
        `
        email,
        role,
        tenant_id,
        invited_by
      `
      )
      .eq('id', invitationId)
      .single();

    if (invitationData) {
      // Send invitation email
      const invitationUrl = `${window.location.origin}/invite/${token}`;
      const expirationDate = expiresAt.toLocaleDateString();

      // Get inviter information for the email
      const { data: inviterData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', invitationData.invited_by)
        .single();

      const inviterName = inviterData
        ? `${inviterData.first_name} ${inviterData.last_name}`
        : 'Your administrator';

      // Get tenant information for the email
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', invitationData.tenant_id)
        .single();

      const tenantName = tenantData?.name || 'Your organization';

      const emailResult = await sendInvitationEmail({
        to: invitationData.email,
        tenantName,
        inviterName,
        role: invitationData.role,
        invitationUrl,
        expirationDate,
        adminEmail: inviterData
          ? `${inviterData.first_name.toLowerCase()}.${inviterData.last_name.toLowerCase()}@${tenantName.toLowerCase().replace(/\s+/g, '')}.com`
          : 'admin@example.com',
      });

      // Log email sending result but don't fail the resend if email fails
      if (emailResult.error || !emailResult.data?.success) {
        console.warn(
          'Failed to send resend invitation email:',
          emailResult.error?.message || emailResult.data?.error
        );
      } else {
        // Log successful invitation resend
        await logInvitationEvent('INVITATION_RESENT', 'LOW', invitationData.email, {
          invitationId,
          resentBy: context.userId,
          tenantId: context.tenantId,
          newExpiresAt: expiresAt.toISOString(),
        });
      }
    }

    return {
      data: { token },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to resend invitation',
      },
    };
  }
}

/**
 * Get invitation details by token (for display purposes)
 */
export async function getInvitationByToken(token: string): Promise<SupabaseResponse<Invitation>> {
  try {
    const hashedToken = await hashToken(token);

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', hashedToken)
      .single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return {
      data: convertInvitationFromDb(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get invitation',
      },
    };
  }
}

// ============================================================================
// DATA CONVERSION HELPERS
// ============================================================================

function convertInvitationFromDb(dbInvitation: InvitationDbResponse): Invitation {
  return {
    id: dbInvitation.id,
    tenantId: dbInvitation.tenant_id,
    email: dbInvitation.email,
    role: dbInvitation.role,
    invitedBy: dbInvitation.invited_by,
    token: dbInvitation.token,
    expiresAt: new Date(dbInvitation.expires_at),
    acceptedAt: dbInvitation.accepted_at ? new Date(dbInvitation.accepted_at) : undefined,
    createdAt: new Date(dbInvitation.created_at),
    updatedAt: new Date(dbInvitation.updated_at),
  };
}

function convertPendingInvitationFromDb(
  dbInvitation: PendingInvitationDbResponse
): PendingInvitation {
  return {
    id: dbInvitation.id,
    tenantId: dbInvitation.tenant_id,
    email: dbInvitation.email,
    role: dbInvitation.role,
    token: dbInvitation.token,
    expiresAt: new Date(dbInvitation.expires_at),
    createdAt: new Date(dbInvitation.created_at),
    invitedByFirstName: dbInvitation.invited_by_first_name,
    invitedByLastName: dbInvitation.invited_by_last_name,
    invitedByEmail: dbInvitation.invited_by_email,
    tenantName: dbInvitation.tenant_name,
    isExpired: dbInvitation.is_expired,
  };
}
