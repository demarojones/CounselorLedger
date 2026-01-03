/**
 * Security Event Types
 *
 * Types for security event logging and monitoring system
 */

export type SecurityEventType =
  | 'INVITATION_CREATED'
  | 'INVITATION_ACCEPTED'
  | 'INVITATION_FAILED'
  | 'INVITATION_EXPIRED'
  | 'INVITATION_CANCELLED'
  | 'INVITATION_RESENT'
  | 'SETUP_TOKEN_USED'
  | 'SETUP_TOKEN_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'AUTH_FAILURE'
  | 'TOKEN_MANIPULATION'
  | 'DUPLICATE_EMAIL_ATTEMPT'
  | 'INVALID_TOKEN_ACCESS';

export type SecurityEventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent {
  id: string;
  tenantId?: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  email?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

export interface SecurityEventDbResponse {
  id: string;
  tenant_id?: string;
  event_type: SecurityEventType;
  severity: SecurityEventSeverity;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  email?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SecurityEventCreateData {
  tenantId?: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  email?: string;
  details?: Record<string, any>;
}

export interface SecurityEventSummary {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  eventCount: number;
  uniqueIps: number;
  lastOccurrence: Date;
}

export interface SecurityEventSummaryDbResponse {
  event_type: SecurityEventType;
  severity: SecurityEventSeverity;
  event_count: string;
  unique_ips: string;
  last_occurrence: string;
}

export interface SuspiciousActivity {
  tenantId?: string;
  ipAddress?: string;
  email?: string;
  eventCount: number;
  eventTypes: number;
  lastEvent: Date;
  eventTypeList: SecurityEventType[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SuspiciousActivityDbResponse {
  tenant_id?: string;
  ip_address?: string;
  email?: string;
  event_count: string;
  event_types: string;
  last_event: string;
  event_type_list: SecurityEventType[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SecurityEventFilters {
  eventType?: SecurityEventType;
  severity?: SecurityEventSeverity;
  userId?: string;
  ipAddress?: string;
  email?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SecurityEventStats {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  uniqueIps: number;
  uniqueEmails: number;
  mostCommonEventType: SecurityEventType;
  recentEvents: SecurityEvent[];
}
