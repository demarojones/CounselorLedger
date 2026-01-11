/**
 * Audit Service for Privacy Compliance
 *
 * Handles audit logging for interaction data access events and privacy violations
 * while ensuring audit logs don't expose private interaction content.
 */

import { supabase } from './supabase';
import { getTenantContext, handleSupabaseError, type SupabaseResponse } from './supabaseHelpers';
import { logSecurityEvent } from './securityEventService';
import type { SecurityEventType, SecurityEventSeverity } from '@/types/security';

// ============================================================================
// PRIVACY AUDIT EVENT TYPES
// ============================================================================

export type PrivacyAuditEventType =
  | 'INTERACTION_ACCESS'
  | 'INTERACTION_CREATE'
  | 'INTERACTION_UPDATE'
  | 'INTERACTION_DELETE'
  | 'INTERACTION_BULK_ACCESS'
  | 'PRIVACY_VIOLATION_ATTEMPT'
  | 'UNAUTHORIZED_INTERACTION_ACCESS'
  | 'CROSS_COUNSELOR_ACCESS_DENIED'
  | 'ADMIN_AGGREGATED_ACCESS'
  | 'INTERACTION_SEARCH'
  | 'STUDENT_INTERACTION_HISTORY_ACCESS'
  | 'CONTACT_INTERACTION_HISTORY_ACCESS';

export interface PrivacyAuditEvent {
  id: string;
  tenantId: string;
  eventType: PrivacyAuditEventType;
  severity: SecurityEventSeverity;
  userId: string;
  resourceType: 'interaction' | 'student' | 'contact';
  resourceId: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'search' | 'bulk';
  accessGranted: boolean;
  denialReason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface PrivacyComplianceReport {
  tenantId: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  totalAccessEvents: number;
  authorizedAccess: number;
  deniedAccess: number;
  privacyViolationAttempts: number;
  uniqueUsers: number;
  mostAccessedResourceType: string;
  complianceScore: number; // Percentage of authorized vs total access attempts
  eventsByType: Record<PrivacyAuditEventType, number>;
  eventsBySeverity: Record<SecurityEventSeverity, number>;
  topUsers: Array<{
    userId: string;
    accessCount: number;
    violationCount: number;
  }>;
}

// ============================================================================
// AUDIT LOGGING FUNCTIONS
// ============================================================================

/**
 * Log interaction data access event
 */
export async function logInteractionAccess(
  interactionId: string,
  operation: 'create' | 'read' | 'update' | 'delete',
  accessGranted: boolean,
  denialReason?: string,
  metadata?: Record<string, any>
): Promise<SupabaseResponse<string>> {
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

    const eventType: PrivacyAuditEventType =
      `INTERACTION_${operation.toUpperCase()}` as PrivacyAuditEventType;
    const severity: SecurityEventSeverity = accessGranted ? 'LOW' : 'MEDIUM';

    // Prepare audit metadata without exposing interaction content
    const auditMetadata = {
      resourceType: 'interaction',
      resourceId: interactionId,
      operation,
      accessGranted,
      denialReason,
      userRole: context.userRole,
      ...metadata,
    };

    // Log to security events table
    const result = await logSecurityEvent({
      tenantId: context.tenantId,
      eventType: eventType as SecurityEventType,
      severity,
      userId: context.userId,
      details: auditMetadata,
    });

    if (result.error) {
      return {
        data: null,
        error: result.error,
      };
    }

    return {
      data: result.data?.id || 'logged',
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to log interaction access',
      },
    };
  }
}

/**
 * Log privacy violation attempt
 */
export async function logPrivacyViolation(
  resourceType: 'interaction' | 'student' | 'contact',
  resourceId: string,
  violationType: 'cross_counselor_access' | 'cross_tenant_access' | 'unauthorized_bulk_operation',
  attemptedOperation: string,
  metadata?: Record<string, any>
): Promise<SupabaseResponse<string>> {
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

    const auditMetadata = {
      resourceType,
      resourceId,
      violationType,
      attemptedOperation,
      userRole: context.userRole,
      ...metadata,
    };

    // Log as high severity security event
    const result = await logSecurityEvent({
      tenantId: context.tenantId,
      eventType: 'PRIVACY_VIOLATION_ATTEMPT' as SecurityEventType,
      severity: 'HIGH',
      userId: context.userId,
      details: auditMetadata,
    });

    if (result.error) {
      return {
        data: null,
        error: result.error,
      };
    }

    return {
      data: result.data?.id || 'logged',
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to log privacy violation',
      },
    };
  }
}

/**
 * Log bulk operation access
 */
export async function logBulkInteractionAccess(
  interactionIds: string[],
  operation: 'read' | 'update' | 'delete',
  accessResults: Array<{ id: string; granted: boolean; reason?: string }>,
  metadata?: Record<string, any>
): Promise<SupabaseResponse<string>> {
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

    const grantedCount = accessResults.filter(r => r.granted).length;
    const deniedCount = accessResults.length - grantedCount;

    const auditMetadata = {
      resourceType: 'interaction',
      operation: `bulk_${operation}`,
      totalRequested: interactionIds.length,
      accessGranted: grantedCount,
      accessDenied: deniedCount,
      userRole: context.userRole,
      deniedIds: accessResults.filter(r => !r.granted).map(r => r.id),
      ...metadata,
    };

    const severity: SecurityEventSeverity = deniedCount > 0 ? 'MEDIUM' : 'LOW';

    // Log to security events table
    const result = await logSecurityEvent({
      tenantId: context.tenantId,
      eventType: 'INTERACTION_BULK_ACCESS' as SecurityEventType,
      severity,
      userId: context.userId,
      details: auditMetadata,
    });

    if (result.error) {
      return {
        data: null,
        error: result.error,
      };
    }

    return {
      data: result.data?.id || 'logged',
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to log bulk interaction access',
      },
    };
  }
}

/**
 * Log admin aggregated access
 */
export async function logAdminAggregatedAccess(
  operation: 'dashboard_stats' | 'reports' | 'user_management' | 'analytics',
  resourceCount: number,
  metadata?: Record<string, any>
): Promise<SupabaseResponse<string>> {
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

    // Only log for admin users
    if (context.userRole !== 'ADMIN') {
      return {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only admin users can perform aggregated access',
        },
      };
    }

    const auditMetadata = {
      operation,
      resourceCount,
      userRole: context.userRole,
      ...metadata,
    };

    // Log as low severity for normal admin operations
    const result = await logSecurityEvent({
      tenantId: context.tenantId,
      eventType: 'ADMIN_AGGREGATED_ACCESS' as SecurityEventType,
      severity: 'LOW',
      userId: context.userId,
      details: auditMetadata,
    });

    if (result.error) {
      return {
        data: null,
        error: result.error,
      };
    }

    return {
      data: result.data?.id || 'logged',
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to log admin aggregated access',
      },
    };
  }
}

/**
 * Log interaction search activity
 */
export async function logInteractionSearch(
  searchQuery: string,
  resultCount: number,
  metadata?: Record<string, any>
): Promise<SupabaseResponse<string>> {
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

    const auditMetadata = {
      operation: 'search',
      resultCount,
      userRole: context.userRole,
      // Don't log the actual search query to avoid exposing sensitive terms
      hasSearchQuery: !!searchQuery,
      queryLength: searchQuery?.length || 0,
      ...metadata,
    };

    // Log as low severity for normal search operations
    const result = await logSecurityEvent({
      tenantId: context.tenantId,
      eventType: 'INTERACTION_SEARCH' as SecurityEventType,
      severity: 'LOW',
      userId: context.userId,
      details: auditMetadata,
    });

    if (result.error) {
      return {
        data: null,
        error: result.error,
      };
    }

    return {
      data: result.data?.id || 'logged',
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to log interaction search',
      },
    };
  }
}

// ============================================================================
// COMPLIANCE REPORTING
// ============================================================================

/**
 * Generate privacy compliance report for a tenant
 */
export async function generatePrivacyComplianceReport(
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<SupabaseResponse<PrivacyComplianceReport>> {
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

    // Use provided tenant ID or current user's tenant
    const reportTenantId = tenantId || context.tenantId;

    // Only admins can generate reports for their tenant
    if (context.userRole !== 'ADMIN') {
      return {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only admin users can generate compliance reports',
        },
      };
    }

    // Query security events for privacy-related activities
    const { data: events, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('tenant_id', reportTenantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('event_type', [
        'INTERACTION_ACCESS',
        'INTERACTION_CREATE',
        'INTERACTION_UPDATE',
        'INTERACTION_DELETE',
        'INTERACTION_BULK_ACCESS',
        'PRIVACY_VIOLATION_ATTEMPT',
        'UNAUTHORIZED_INTERACTION_ACCESS',
        'CROSS_COUNSELOR_ACCESS_DENIED',
        'ADMIN_AGGREGATED_ACCESS',
        'INTERACTION_SEARCH',
        'STUDENT_INTERACTION_HISTORY_ACCESS',
        'CONTACT_INTERACTION_HISTORY_ACCESS',
      ]);

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    // Process events to generate report
    const totalAccessEvents = events?.length || 0;
    const authorizedAccess =
      events?.filter(
        e =>
          e.details?.accessGranted !== false &&
          !e.event_type.includes('VIOLATION') &&
          !e.event_type.includes('DENIED')
      ).length || 0;
    const deniedAccess = totalAccessEvents - authorizedAccess;
    const privacyViolationAttempts =
      events?.filter(e => e.event_type.includes('VIOLATION') || e.event_type.includes('DENIED'))
        .length || 0;

    const uniqueUsers = new Set(events?.map(e => e.user_id).filter(Boolean)).size;

    // Calculate events by type
    const eventsByType =
      events?.reduce(
        (acc, event) => {
          const type = event.event_type as PrivacyAuditEventType;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<PrivacyAuditEventType, number>
      ) || {};

    // Calculate events by severity
    const eventsBySeverity =
      events?.reduce(
        (acc, event) => {
          const severity = event.severity as SecurityEventSeverity;
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        },
        {} as Record<SecurityEventSeverity, number>
      ) || {};

    // Find most accessed resource type
    const resourceTypeCounts =
      events?.reduce(
        (acc, event) => {
          const resourceType = event.details?.resourceType || 'unknown';
          acc[resourceType] = (acc[resourceType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const mostAccessedResourceType =
      Object.entries(resourceTypeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'interaction';

    // Calculate top users by access count
    const userAccessCounts =
      events?.reduce(
        (acc, event) => {
          if (event.user_id) {
            if (!acc[event.user_id]) {
              acc[event.user_id] = { accessCount: 0, violationCount: 0 };
            }
            acc[event.user_id].accessCount++;
            if (event.event_type.includes('VIOLATION') || event.event_type.includes('DENIED')) {
              acc[event.user_id].violationCount++;
            }
          }
          return acc;
        },
        {} as Record<string, { accessCount: number; violationCount: number }>
      ) || {};

    const topUsers = Object.entries(userAccessCounts)
      .map(([userId, counts]) => ({
        userId,
        accessCount: counts.accessCount,
        violationCount: counts.violationCount,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    // Calculate compliance score (percentage of authorized access)
    const complianceScore =
      totalAccessEvents > 0 ? Math.round((authorizedAccess / totalAccessEvents) * 100) : 100;

    const report: PrivacyComplianceReport = {
      tenantId: reportTenantId,
      reportPeriod: {
        startDate,
        endDate,
      },
      totalAccessEvents,
      authorizedAccess,
      deniedAccess,
      privacyViolationAttempts,
      uniqueUsers,
      mostAccessedResourceType,
      complianceScore,
      eventsByType,
      eventsBySeverity,
      topUsers,
    };

    // Log the report generation
    await logSecurityEvent({
      tenantId: context.tenantId,
      eventType: 'ADMIN_AGGREGATED_ACCESS' as SecurityEventType,
      severity: 'LOW',
      userId: context.userId,
      details: {
        operation: 'compliance_report_generation',
        reportPeriod: `${startDate.toISOString()} to ${endDate.toISOString()}`,
        totalEvents: totalAccessEvents,
      },
    });

    return {
      data: report,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate compliance report',
      },
    };
  }
}

/**
 * Get audit trail for a specific interaction (without exposing content)
 */
export async function getInteractionAuditTrail(interactionId: string): Promise<
  SupabaseResponse<
    Array<{
      eventType: string;
      operation: string;
      userId: string;
      accessGranted: boolean;
      timestamp: Date;
      userRole?: string;
    }>
  >
> {
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

    // Only admins can view audit trails
    if (context.userRole !== 'ADMIN') {
      return {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only admin users can view audit trails',
        },
      };
    }

    const { data: events, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .contains('details', { resourceId: interactionId })
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const auditTrail =
      events?.map(event => ({
        eventType: event.event_type,
        operation: event.details?.operation || 'unknown',
        userId: event.user_id,
        accessGranted: event.details?.accessGranted !== false,
        timestamp: new Date(event.created_at),
        userRole: event.details?.userRole,
      })) || [];

    return {
      data: auditTrail,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get interaction audit trail',
      },
    };
  }
}
