/**
 * Security Event Service
 *
 * Handles logging and retrieval of security events for monitoring
 * suspicious invitation patterns and other security-related activities.
 */

import { supabase } from './supabase';
import { getTenantContext, handleSupabaseError, type SupabaseResponse } from './supabaseHelpers';
import type {
  SecurityEvent,
  SecurityEventDbResponse,
  SecurityEventCreateData,
  SecurityEventSummary,
  SecurityEventSummaryDbResponse,
  SuspiciousActivity,
  SuspiciousActivityDbResponse,
  SecurityEventFilters,
  SecurityEventStats,
  SecurityEventType,
  SecurityEventSeverity,
} from '@/types/security';

/**
 * Get client IP address (best effort)
 */
function getClientIpAddress(): string | undefined {
  // In a real application, this would be provided by the server
  // For client-side, we can't reliably get the real IP
  // This is a placeholder that would be replaced with server-side logic
  return undefined;
}

/**
 * Get user agent string
 */
function getUserAgent(): string {
  return navigator.userAgent;
}

/**
 * Log a security event
 */
export async function logSecurityEvent(
  eventData: SecurityEventCreateData
): Promise<SupabaseResponse<SecurityEvent>> {
  try {
    const context = await getTenantContext();

    // Prepare the event data
    const insertData = {
      tenant_id: eventData.tenantId || context?.tenantId,
      event_type: eventData.eventType,
      severity: eventData.severity,
      user_id: eventData.userId || context?.userId,
      ip_address: eventData.ipAddress || getClientIpAddress(),
      user_agent: eventData.userAgent || getUserAgent(),
      email: eventData.email,
      details: eventData.details,
    };

    const { data, error } = await supabase
      .from('security_events')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Log to console but don't fail the operation
      console.error('Failed to log security event:', error);
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return {
      data: convertSecurityEventFromDb(data),
      error: null,
    };
  } catch (error) {
    console.error('Error logging security event:', error);
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to log security event',
      },
    };
  }
}

/**
 * Get security events for the current tenant with optional filters
 */
export async function getSecurityEvents(
  filters?: SecurityEventFilters
): Promise<SupabaseResponse<SecurityEvent[]>> {
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

    let query = supabase
      .from('security_events')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.ipAddress) {
      query = query.eq('ip_address', filters.ipAddress);
    }
    if (filters?.email) {
      query = query.eq('email', filters.email);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const events = (data || []).map(convertSecurityEventFromDb);
    return { data: events, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch security events',
      },
    };
  }
}

/**
 * Get security event statistics for the current tenant
 */
export async function getSecurityEventStats(
  days: number = 30
): Promise<SupabaseResponse<SecurityEventStats>> {
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

    const { data, error } = await supabase.rpc('get_security_stats', {
      p_tenant_id: context.tenantId,
      p_days: days,
    });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    // Get recent events
    const recentEventsResult = await getSecurityEvents({
      limit: 10,
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    });

    const summaries = (data || []).map(convertSecurityEventSummaryFromDb);

    // Calculate statistics
    const totalEvents = summaries.reduce((sum: number, s: any) => sum + s.eventCount, 0);
    const criticalEvents = summaries
      .filter((s: any) => s.severity === 'CRITICAL')
      .reduce((sum: number, s: any) => sum + s.eventCount, 0);
    const highSeverityEvents = summaries
      .filter((s: any) => s.severity === 'HIGH')
      .reduce((sum: number, s: any) => sum + s.eventCount, 0);

    const uniqueIps = Math.max(...summaries.map((s: any) => s.uniqueIps), 0);

    // Find most common event type
    const eventTypeCounts = summaries.reduce(
      (acc: any, s: any) => {
        acc[s.eventType] = (acc[s.eventType] || 0) + s.eventCount;
        return acc;
      },
      {} as Record<SecurityEventType, number>
    );

    const mostCommonEventType =
      (Object.entries(eventTypeCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] as SecurityEventType) || 'INVITATION_CREATED';

    const stats: SecurityEventStats = {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      uniqueIps,
      uniqueEmails: 0, // Would need additional query to calculate
      mostCommonEventType,
      recentEvents: recentEventsResult.data || [],
    };

    return { data: stats, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch security stats',
      },
    };
  }
}

/**
 * Get suspicious activity for the current tenant
 */
export async function getSuspiciousActivity(): Promise<SupabaseResponse<SuspiciousActivity[]>> {
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
      .from('suspicious_activity')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('event_count', { ascending: false });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const activities = (data || []).map(convertSuspiciousActivityFromDb);
    return { data: activities, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch suspicious activity',
      },
    };
  }
}

/**
 * Helper function to log invitation-related security events
 */
export async function logInvitationEvent(
  eventType: SecurityEventType,
  severity: SecurityEventSeverity,
  email: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType,
    severity,
    email,
    details,
  });
}

/**
 * Helper function to log rate limiting events
 */
export async function logRateLimitEvent(
  ipAddress?: string,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'RATE_LIMIT_EXCEEDED',
    severity: 'MEDIUM',
    userId,
    ipAddress,
    details,
  });
}

/**
 * Helper function to log authentication failures
 */
export async function logAuthFailure(email?: string, details?: Record<string, any>): Promise<void> {
  await logSecurityEvent({
    eventType: 'AUTH_FAILURE',
    severity: 'MEDIUM',
    email,
    details,
  });
}

/**
 * Helper function to log token manipulation attempts
 */
export async function logTokenManipulation(
  email?: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'TOKEN_MANIPULATION',
    severity: 'HIGH',
    email,
    details,
  });
}

/**
 * Helper function to log suspicious activity patterns
 */
export async function logSuspiciousActivity(details: Record<string, any>): Promise<void> {
  await logSecurityEvent({
    eventType: 'SUSPICIOUS_ACTIVITY',
    severity: 'HIGH',
    details,
  });
}

// ============================================================================
// DATA CONVERSION HELPERS
// ============================================================================

function convertSecurityEventFromDb(dbEvent: SecurityEventDbResponse): SecurityEvent {
  return {
    id: dbEvent.id,
    tenantId: dbEvent.tenant_id,
    eventType: dbEvent.event_type,
    severity: dbEvent.severity,
    userId: dbEvent.user_id,
    ipAddress: dbEvent.ip_address,
    userAgent: dbEvent.user_agent,
    email: dbEvent.email,
    details: dbEvent.details,
    createdAt: new Date(dbEvent.created_at),
  };
}

function convertSecurityEventSummaryFromDb(
  dbSummary: SecurityEventSummaryDbResponse
): SecurityEventSummary {
  return {
    eventType: dbSummary.event_type,
    severity: dbSummary.severity,
    eventCount: parseInt(dbSummary.event_count, 10),
    uniqueIps: parseInt(dbSummary.unique_ips, 10),
    lastOccurrence: new Date(dbSummary.last_occurrence),
  };
}

function convertSuspiciousActivityFromDb(
  dbActivity: SuspiciousActivityDbResponse
): SuspiciousActivity {
  return {
    tenantId: dbActivity.tenant_id,
    ipAddress: dbActivity.ip_address,
    email: dbActivity.email,
    eventCount: parseInt(dbActivity.event_count, 10),
    eventTypes: parseInt(dbActivity.event_types, 10),
    lastEvent: new Date(dbActivity.last_event),
    eventTypeList: dbActivity.event_type_list,
    riskLevel: dbActivity.risk_level,
  };
}
