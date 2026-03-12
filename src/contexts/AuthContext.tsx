/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '../types/user';
import {
  signIn as authSignIn,
  signOut as authSignOut,
  getCurrentUser,
  onAuthStateChange,
  type LoginCredentials,
  type AuthResponse,
} from '../services/auth';
import type { AuthError } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const isAuthenticated = user !== null;

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function initAuth() {
      try {
        console.log('🔐 Initializing auth...');
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Auth initialization timeout'));
          }, 10000); // 10 second timeout
        });

        const authPromise = getCurrentUser();
        
        const { user: currentUser, error: authError } = await Promise.race([
          authPromise,
          timeoutPromise,
        ]);

        clearTimeout(timeoutId);

        if (mounted) {
          // Only treat it as an error if there's an actual error AND it's not just "no session"
          // "No session" is expected when user is not logged in
          const isRealError = authError && 
            authError.message && 
            !authError.message.toLowerCase().includes('session') &&
            !authError.message.toLowerCase().includes('not authenticated');
          
          if (isRealError) {
            console.error('❌ Auth error:', authError);
            setError(authError);
          } else if (authError) {
            console.log('ℹ️ No active session (expected for logged out users)');
          }
          
          setUser(currentUser);
          console.log('✅ Auth initialized:', currentUser ? 'User found' : 'No user');
        }
      } catch (err) {
        if (mounted) {
          console.error('❌ Error initializing auth:', err);
          setUser(null);
          // Only set error for unexpected failures, not for "no session"
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize authentication';
          if (!errorMessage.toLowerCase().includes('session')) {
            setError({
              message: errorMessage,
              name: 'AuthError',
              status: 500,
              code: 'AUTH_INIT_ERROR',
              __isAuthError: true,
            } as unknown as AuthError);
          }
        }
      } finally {
        if (mounted) {
          console.log('🏁 Auth loading complete');
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    const subscription = onAuthStateChange(newUser => {
      setUser(newUser);
      if (newUser) {
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authSignIn(credentials);

      if (response.error) {
        setError(response.error);
        setUser(null);
      } else {
        setUser(response.user);
      }

      return response;
    } catch (err) {
      const authError = {
        message: err instanceof Error ? err.message : 'Login failed',
        name: 'AuthError',
        status: 500,
        code: 'AUTH_ERROR',
        __isAuthError: true,
      } as unknown as AuthError;
      setError(authError);
      return { user: null, error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await authSignOut();

      if (signOutError) {
        setError(signOutError);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error during logout:', err);
      setError({
        message: err instanceof Error ? err.message : 'Logout failed',
        name: 'AuthError',
        status: 500,
        code: 'AUTH_ERROR',
        __isAuthError: true,
      } as unknown as AuthError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: currentUser, error: authError } = await getCurrentUser();

      if (authError) {
        setError(authError);
        setUser(null);
      } else {
        setUser(currentUser);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
      setError({
        message: err instanceof Error ? err.message : 'Failed to refresh user',
        name: 'AuthError',
        status: 500,
        code: 'AUTH_ERROR',
        __isAuthError: true,
      } as unknown as AuthError);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
