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
 * Get user data from application database using auth user ID
 */
async function getApplicationUser(authUserId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        id,
        tenant_id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
      `
      )
      .eq('id', authUserId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role as 'ADMIN' | 'COUNSELOR',
      tenantId: data.tenant_id,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error('Error fetching application user:', error);
    return null;
  }
}

/**
 * Transform Supabase user response to application User type
 * Now fetches user data from application database instead of relying on metadata
 */
async function transformSupabaseUser(supabaseUser: {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<User | null> {
  // Get user data from application database
  const appUser = await getApplicationUser(supabaseUser.id);

  if (!appUser) {
    // Fallback to metadata if application user not found (shouldn't happen in normal flow)
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

  return appUser;
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

    const user = await transformSupabaseUser(
      data.user as {
        id: string;
        email: string;
        created_at?: string;
        updated_at?: string;
        user_metadata?: Record<string, unknown>;
      }
    );
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

    const user = await transformSupabaseUser(
      data.user as {
        id: string;
        email: string;
        created_at?: string;
        updated_at?: string;
        user_metadata?: Record<string, unknown>;
      }
    );
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
      const user = await transformSupabaseUser(
        session.user as {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          user_metadata?: Record<string, unknown>;
        }
      );
      callback(user);
    } else {
      callback(null);
    }
  });

  return subscription;
}
