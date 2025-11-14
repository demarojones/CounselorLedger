/**
 * Supabase Helper Functions
 * 
 * This module provides wrapper functions for common Supabase operations,
 * error handling utilities, real-time subscription helpers, and tenant context management.
 */

import { supabase } from './supabase';
import { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

export interface QueryOptions {
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: 'ADMIN' | 'COUNSELOR';
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Transform Supabase PostgrestError to application SupabaseError
 */
export function handleSupabaseError(error: PostgrestError | null): SupabaseError | null {
  if (!error) return null;

  return {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    details: error.details,
    hint: error.hint,
  };
}

/**
 * Check if error is a Row Level Security (RLS) policy violation
 */
export function isRLSError(error: SupabaseError | null): boolean {
  return (error?.code === '42501' || error?.message?.includes('row-level security')) ?? false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: SupabaseError | null): boolean {
  return (
    (error?.code === 'PGRST301' ||
    error?.message?.includes('JWT') ||
    error?.message?.includes('authentication')) ?? false
  );
}

/**
 * Check if error is a unique constraint violation
 */
export function isUniqueConstraintError(error: SupabaseError | null): boolean {
  return error?.code === '23505';
}

/**
 * Check if error is a foreign key constraint violation
 */
export function isForeignKeyError(error: SupabaseError | null): boolean {
  return error?.code === '23503';
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: SupabaseError | null): string {
  if (!error) return 'An unknown error occurred';

  if (isRLSError(error)) {
    return 'You do not have permission to access this data';
  }

  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again';
  }

  if (isUniqueConstraintError(error)) {
    return 'This record already exists';
  }

  if (isForeignKeyError(error)) {
    return 'Cannot delete this record because it is referenced by other data';
  }

  return error.message || 'An error occurred while processing your request';
}

// ============================================================================
// TENANT CONTEXT
// ============================================================================

/**
 * Get current user's tenant context
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch user details from users table to get tenant_id and role
    const { data: userData, error } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      console.error('Error fetching tenant context:', error);
      return null;
    }

    return {
      tenantId: userData.tenant_id,
      userId: user.id,
      userRole: userData.role,
    };
  } catch (error) {
    console.error('Error getting tenant context:', error);
    return null;
  }
}

/**
 * Verify user belongs to specified tenant
 */
export async function verifyTenantAccess(tenantId: string): Promise<boolean> {
  const context = await getTenantContext();
  return context?.tenantId === tenantId;
}

/**
 * Check if current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const context = await getTenantContext();
  return context?.userRole === 'ADMIN';
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Generic select query with automatic tenant filtering
 */
export async function selectFromTable<T>(
  table: string,
  columns: string = '*',
  options?: QueryOptions
): Promise<SupabaseResponse<T[]>> {
  try {
    let query = supabase.from(table).select(columns);

    // Apply ordering
    if (options?.orderBy) {
      const ascending = options.orderBy.ascending !== undefined ? options.orderBy.ascending : true;
      query = query.order(options.orderBy.column, {
        ascending: ascending,
      });
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    return {
      data: data as T[] | null,
      error: handleSupabaseError(error),
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Generic select single record query
 */
export async function selectSingleFromTable<T>(
  table: string,
  id: string,
  columns: string = '*'
): Promise<SupabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq('id', id)
      .single();

    return {
      data: data as T | null,
      error: handleSupabaseError(error),
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Generic insert query
 */
export async function insertIntoTable<T>(
  table: string,
  data: Partial<T>
): Promise<SupabaseResponse<T>> {
  try {
    const { data: insertedData, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    return {
      data: insertedData as T | null,
      error: handleSupabaseError(error),
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Generic update query
 */
export async function updateInTable<T>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<SupabaseResponse<T>> {
  try {
    const { data: updatedData, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    return {
      data: updatedData as T | null,
      error: handleSupabaseError(error),
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Generic delete query
 */
export async function deleteFromTable(
  table: string,
  id: string
): Promise<SupabaseResponse<null>> {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);

    return {
      data: null,
      error: handleSupabaseError(error),
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface SubscriptionOptions<T> {
  table: string;
  event: RealtimeEvent;
  filter?: string;
  callback: (payload: RealtimePayload<T>) => void;
}

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  errors: string[] | null;
}

/**
 * Subscribe to real-time changes on a table
 */
export function subscribeToTable<T>(
  options: SubscriptionOptions<T>
): RealtimeChannel {
  const channel = supabase.channel(`${options.table}-changes`);

  channel
    .on(
      'postgres_changes' as any,
      {
        event: options.event,
        schema: 'public',
        table: options.table,
        filter: options.filter,
      },
      (payload: any) => {
        const transformedPayload: RealtimePayload<T> = {
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T | null,
          old: payload.old as T | null,
          errors: payload.errors || null,
        };
        options.callback(transformedPayload);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a real-time channel
 */
export async function unsubscribeFromChannel(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
}

/**
 * Subscribe to interactions for current user
 */
export function subscribeToUserInteractions(
  callback: (payload: RealtimePayload<any>) => void
): RealtimeChannel {
  return subscribeToTable({
    table: 'interactions',
    event: '*',
    callback,
  });
}

/**
 * Subscribe to students table changes
 */
export function subscribeToStudents(
  callback: (payload: RealtimePayload<any>) => void
): RealtimeChannel {
  return subscribeToTable({
    table: 'students',
    event: '*',
    callback,
  });
}

/**
 * Subscribe to contacts table changes
 */
export function subscribeToContacts(
  callback: (payload: RealtimePayload<any>) => void
): RealtimeChannel {
  return subscribeToTable({
    table: 'contacts',
    event: '*',
    callback,
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Insert multiple records in a single query
 */
export async function batchInsert<T>(
  table: string,
  records: Partial<T>[]
): Promise<SupabaseResponse<T[]>> {
  try {
    const { data, error } = await supabase.from(table).insert(records).select();

    return {
      data: data as T[] | null,
      error: handleSupabaseError(error),
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Update multiple records matching a condition
 */
export async function batchUpdate<T>(
  table: string,
  updates: Partial<T>,
  condition: { column: string; value: any }
): Promise<SupabaseResponse<T[]>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq(condition.column, condition.value)
      .select();

    return {
      data: data as T[] | null,
      error: handleSupabaseError(error),
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && url !== 'https://mock.supabase.co' && key !== 'mock-anon-key');
}

/**
 * Check if mock data mode is enabled
 */
export function isMockDataMode(): boolean {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

/**
 * Get current database connection status
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('tenants').select('id').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
}
