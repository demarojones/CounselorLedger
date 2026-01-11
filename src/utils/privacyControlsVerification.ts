/**
 * Privacy Controls Verification Utility
 *
 * This utility provides functions to verify that privacy controls are working correctly.
 * Used for testing and validation of counselor interaction privacy.
 */

import { getTenantContext } from '../services/supabaseHelpers';
import { fetchInteractions, fetchStudents, fetchContacts } from '../services/api';

export interface PrivacyVerificationResult {
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Verify that tenant context is properly retrieved
 */
export async function verifyTenantContext(): Promise<PrivacyVerificationResult> {
  try {
    const context = await getTenantContext();

    if (!context) {
      return {
        passed: false,
        message: 'Tenant context is null - user may not be authenticated',
      };
    }

    if (!context.tenantId || !context.userId || !context.userRole) {
      return {
        passed: false,
        message: 'Tenant context is incomplete',
        details: context,
      };
    }

    return {
      passed: true,
      message: 'Tenant context successfully retrieved',
      details: {
        tenantId: context.tenantId,
        userId: context.userId,
        userRole: context.userRole,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Error retrieving tenant context: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify that interactions are properly filtered by counselor
 */
export async function verifyInteractionFiltering(): Promise<PrivacyVerificationResult> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        passed: false,
        message: 'Cannot verify interaction filtering - no tenant context',
      };
    }

    const { data: interactions, error } = await fetchInteractions();

    if (error) {
      return {
        passed: false,
        message: `Error fetching interactions: ${error.message}`,
      };
    }

    if (!interactions) {
      return {
        passed: true,
        message: 'No interactions found - filtering cannot be verified but no error occurred',
      };
    }

    // For counselors, verify all interactions belong to them
    if (context.userRole === 'COUNSELOR') {
      const nonOwnedInteractions = interactions.filter(
        interaction => interaction.counselorId !== context.userId
      );

      if (nonOwnedInteractions.length > 0) {
        return {
          passed: false,
          message: `Counselor can see ${nonOwnedInteractions.length} interactions they don't own`,
          details: {
            totalInteractions: interactions.length,
            nonOwnedCount: nonOwnedInteractions.length,
            nonOwnedIds: nonOwnedInteractions.map(i => i.id),
          },
        };
      }

      return {
        passed: true,
        message: `Counselor filtering verified - all ${interactions.length} interactions belong to current user`,
        details: {
          totalInteractions: interactions.length,
          counselorId: context.userId,
        },
      };
    }

    // For admins, they should be able to see all tenant interactions
    if (context.userRole === 'ADMIN') {
      return {
        passed: true,
        message: `Admin access verified - can see ${interactions.length} interactions`,
        details: {
          totalInteractions: interactions.length,
          userRole: context.userRole,
        },
      };
    }

    return {
      passed: false,
      message: `Unknown user role: ${context.userRole}`,
    };
  } catch (error) {
    return {
      passed: false,
      message: `Error verifying interaction filtering: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify that shared data (students, contacts) is accessible to all tenant users
 */
export async function verifySharedDataAccess(): Promise<PrivacyVerificationResult> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        passed: false,
        message: 'Cannot verify shared data access - no tenant context',
      };
    }

    // Test students access
    const { data: students, error: studentsError } = await fetchStudents();
    if (studentsError) {
      return {
        passed: false,
        message: `Error accessing students: ${studentsError.message}`,
      };
    }

    // Test contacts access
    const { data: contacts, error: contactsError } = await fetchContacts();
    if (contactsError) {
      return {
        passed: false,
        message: `Error accessing contacts: ${contactsError.message}`,
      };
    }

    return {
      passed: true,
      message: 'Shared data access verified - can access students and contacts',
      details: {
        studentsCount: students?.length || 0,
        contactsCount: contacts?.length || 0,
        userRole: context.userRole,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Error verifying shared data access: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Run all privacy verification tests
 */
export async function runPrivacyVerification(): Promise<{
  overall: boolean;
  results: Record<string, PrivacyVerificationResult>;
}> {
  const results = {
    tenantContext: await verifyTenantContext(),
    interactionFiltering: await verifyInteractionFiltering(),
    sharedDataAccess: await verifySharedDataAccess(),
  };

  const overall = Object.values(results).every(result => result.passed);

  return { overall, results };
}

/**
 * Format verification results for display
 */
export function formatVerificationResults(
  results: Record<string, PrivacyVerificationResult>
): string {
  let output = 'Privacy Controls Verification Results:\n\n';

  for (const [testName, result] of Object.entries(results)) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    output += `${status} ${testName}: ${result.message}\n`;

    if (result.details) {
      output += `   Details: ${JSON.stringify(result.details, null, 2)}\n`;
    }
    output += '\n';
  }

  return output;
}
