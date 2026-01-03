import { supabase } from './supabase';
import { parseSupabaseError } from '@/utils/errorHandling';

/**
 * Wrapper for Supabase queries with consistent error handling
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await queryFn();

  if (error) {
    throw parseSupabaseError(error);
  }

  if (data === null) {
    throw parseSupabaseError({ message: 'No data returned from query' });
  }

  return data;
}

/**
 * Wrapper for Supabase mutations with consistent error handling
 */
export async function executeMutation<T>(
  mutationFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await mutationFn();

  if (error) {
    throw parseSupabaseError(error);
  }

  if (data === null) {
    throw parseSupabaseError({ message: 'No data returned from mutation' });
  }

  return data;
}

/**
 * Check if user is authenticated
 */
export async function checkAuth(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Get current user with error handling
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw parseSupabaseError(error);
  }

  return user;
}
