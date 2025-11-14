import { supabase, type AuthError } from './supabase';
import type { User } from '../types/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Transform Supabase user response to application User type
 */
function transformSupabaseUser(supabaseUser: {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: Record<string, unknown>;
}): User {
  const metadata = supabaseUser.user_metadata || {};

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    firstName: (metadata.first_name as string) || '',
    lastName: (metadata.last_name as string) || '',
    role: (metadata.role as 'ADMIN' | 'COUNSELOR') || 'COUNSELOR',
    tenantId: (metadata.tenant_id as string) || '',
    isActive: true,
    createdAt: new Date(supabaseUser.created_at || Date.now()),
    updatedAt: new Date(supabaseUser.updated_at || Date.now()),
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { user: null, error };
    }

    if (!data.user) {
      return {
        user: null,
        error: {
          message: 'No user returned from authentication',
          name: 'AuthError',
          status: 401,
        } as AuthError,
      };
    }

    const user = transformSupabaseUser(data.user as { id: string; email: string; created_at?: string; updated_at?: string; user_metadata?: Record<string, unknown> });
    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        name: 'AuthError',
        status: 500,
      } as AuthError,
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        name: 'AuthError',
        status: 500,
      } as AuthError,
    };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error };
    }

    if (!data.user) {
      return { user: null, error: null };
    }

    const user = transformSupabaseUser(data.user as { id: string; email: string; created_at?: string; updated_at?: string; user_metadata?: Record<string, unknown> });
    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        name: 'AuthError',
        status: 500,
      } as AuthError,
    };
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at || 0,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.refreshSession();
    return { error };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        name: 'AuthError',
        status: 500,
      } as AuthError,
    };
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const user = transformSupabaseUser(session.user as { id: string; email: string; created_at?: string; updated_at?: string; user_metadata?: Record<string, unknown> });
      callback(user);
    } else {
      callback(null);
    }
  });

  return subscription;
}
