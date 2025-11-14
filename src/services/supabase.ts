import {
  createClient,
  type SupabaseClient,
  type AuthError,
  type User as SupabaseUser,
} from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Export Supabase types for convenience
export type { SupabaseUser, AuthError };

// Re-export helper functions for convenience
export * from './supabaseHelpers';
