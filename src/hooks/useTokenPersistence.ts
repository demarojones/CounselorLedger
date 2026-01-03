/**
 * Token Persistence Hook
 *
 * React hook for managing token persistence during navigation.
 * Ensures tokens remain valid and cached across page transitions.
 */

import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  storeTokenSession,
  getTokenSession,
  updateTokenSessionAccess,
  clearTokenSession,
  getCachedTokenValidation,
  cacheTokenValidation,
  handleTokenNavigation,
  getSessionStats,
  type TokenSessionData,
  type TokenValidationCache,
} from '@/services/tokenPersistenceService';

export interface UseTokenPersistenceOptions {
  /** The token to persist */
  token?: string;
  /** Token type */
  type?: 'invitation' | 'setup';
  /** Whether to automatically handle navigation updates */
  autoUpdateOnNavigation?: boolean;
  /** Whether to clear session on unmount */
  clearOnUnmount?: boolean;
}

export interface UseTokenPersistenceReturn {
  /** Current session data */
  session: TokenSessionData | null;
  /** Cached validation data */
  cachedValidation: TokenValidationCache | null;
  /** Whether there's an active session */
  hasActiveSession: boolean;
  /** Session statistics */
  stats: ReturnType<typeof getSessionStats>;
  /** Store token session */
  storeSession: (
    token: string,
    type: 'invitation' | 'setup',
    validation?: TokenValidationCache
  ) => void;
  /** Clear current session */
  clearSession: () => void;
  /** Update session access time */
  updateAccess: () => void;
  /** Cache validation result */
  cacheValidation: (token: string, validation: Parameters<typeof cacheTokenValidation>[1]) => void;
  /** Handle navigation for token */
  handleNavigation: (token: string, type: 'invitation' | 'setup') => void;
}

/**
 * Hook for managing token persistence during navigation
 */
export function useTokenPersistence(
  options: UseTokenPersistenceOptions = {}
): UseTokenPersistenceReturn {
  const { token, type, autoUpdateOnNavigation = true, clearOnUnmount = false } = options;

  const location = useLocation();
  const [session, setSession] = useState<TokenSessionData | null>(null);
  const [cachedValidation, setCachedValidation] = useState<TokenValidationCache | null>(null);
  const [stats, setStats] = useState(() => getSessionStats());

  // Load initial session and cache
  useEffect(() => {
    const currentSession = getTokenSession();
    setSession(currentSession);

    if (currentSession) {
      const cached = getCachedTokenValidation(currentSession.token);
      setCachedValidation(cached);
    }

    setStats(getSessionStats());
  }, []);

  // Store session if token and type are provided
  useEffect(() => {
    if (token && type) {
      const cached = getCachedTokenValidation(token);
      storeTokenSession(token, type, cached || undefined);

      // Update local state
      const newSession = getTokenSession();
      setSession(newSession);
      setCachedValidation(cached);
      setStats(getSessionStats());
    }
  }, [token, type]);

  // Handle navigation updates
  useEffect(() => {
    if (autoUpdateOnNavigation && session) {
      updateTokenSessionAccess();
      setStats(getSessionStats());
    }
  }, [location.pathname, autoUpdateOnNavigation, session]);

  // Clear session on unmount if requested
  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        clearTokenSession();
      }
    };
  }, [clearOnUnmount]);

  const storeSession = useCallback(
    (
      sessionToken: string,
      sessionType: 'invitation' | 'setup',
      validation?: TokenValidationCache
    ) => {
      storeTokenSession(sessionToken, sessionType, validation);
      const newSession = getTokenSession();
      setSession(newSession);
      setStats(getSessionStats());
    },
    []
  );

  const clearSession = useCallback(() => {
    clearTokenSession();
    setSession(null);
    setCachedValidation(null);
    setStats(getSessionStats());
  }, []);

  const updateAccess = useCallback(() => {
    updateTokenSessionAccess();
    const updatedSession = getTokenSession();
    setSession(updatedSession);
    setStats(getSessionStats());
  }, []);

  const cacheValidation = useCallback(
    (cacheToken: string, validation: Parameters<typeof cacheTokenValidation>[1]) => {
      cacheTokenValidation(cacheToken, validation);
      const cached = getCachedTokenValidation(cacheToken);
      setCachedValidation(cached);
    },
    []
  );

  const handleNavigation = useCallback((navToken: string, navType: 'invitation' | 'setup') => {
    handleTokenNavigation(navToken, navType);
    const newSession = getTokenSession();
    setSession(newSession);
    setStats(getSessionStats());
  }, []);

  return {
    session,
    cachedValidation,
    hasActiveSession: !!session,
    stats,
    storeSession,
    clearSession,
    updateAccess,
    cacheValidation,
    handleNavigation,
  };
}

/**
 * Hook for token validation with caching
 */
export function useTokenValidationCache(token?: string) {
  const [cachedValidation, setCachedValidation] = useState<TokenValidationCache | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      const cached = getCachedTokenValidation(token);
      setCachedValidation(cached);
    }
  }, [token]);

  const cacheValidation = useCallback(
    (cacheToken: string, validation: Parameters<typeof cacheTokenValidation>[1]) => {
      cacheTokenValidation(cacheToken, validation);
      const cached = getCachedTokenValidation(cacheToken);
      setCachedValidation(cached);
    },
    []
  );

  const validateWithCache = useCallback(
    async <T>(
      validateToken: string,
      validationFunction: (token: string) => Promise<T>,
      cacheExtractor?: (result: T) => Parameters<typeof cacheTokenValidation>[1]
    ): Promise<T> => {
      setLoading(true);
      try {
        // Check cache first
        const cached = getCachedTokenValidation(validateToken);
        if (cached && cached.isValid) {
          console.log('Using cached token validation');
          // Note: In a real implementation, you might want to return the cached result
          // if it matches the expected return type of validationFunction
        }

        // Perform validation
        const result = await validationFunction(validateToken);

        // Cache result if extractor provided
        if (cacheExtractor) {
          const cacheData = cacheExtractor(result);
          cacheValidation(validateToken, cacheData);
        }

        return result;
      } finally {
        setLoading(false);
      }
    },
    [cacheValidation]
  );

  return {
    cachedValidation,
    loading,
    cacheValidation,
    validateWithCache,
  };
}
