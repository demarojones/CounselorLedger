import { useEffect, useState, useCallback } from 'react';

interface TokenValidation {
  isValid: boolean;
  tenantId?: string;
  email?: string;
  token?: string;        // the raw token string, stored for cache-hit comparison
  tenantName?: string;
  adminEmail?: string;
  expiresAt?: Date;      // kept as Date so callers don't need to re-parse
  role?: string;
}

interface UseTokenPersistenceOptions {
  token: string | null | undefined;
  onValidationComplete?: (validation: TokenValidation) => void;
  redirectOnInvalid?: boolean;
  clearOnUnmount?: boolean;
}

/**
 * Hook for managing token persistence
 */
export function useTokenPersistence(options?: UseTokenPersistenceOptions) {
  const [cachedValidation, setCachedValidation] = useState<TokenValidation | null>(null);

  const persistToken = useCallback(() => {
    if (options?.token) {
      sessionStorage.setItem('setup_token', options.token);
    }
  }, [options?.token]);

  const clearToken = useCallback(() => {
    sessionStorage.removeItem('setup_token');
    sessionStorage.removeItem('token_validation');
  }, []);

  const getToken = useCallback(() => {
    return sessionStorage.getItem('setup_token');
  }, []);

  const cacheValidation = useCallback((token: string, validation: Omit<TokenValidation, 'token'>) => {
    const withToken: TokenValidation = { ...validation, token };
    setCachedValidation(withToken);
    sessionStorage.setItem('token_validation', JSON.stringify(withToken));
  }, []);

  // handleNavigation is intentionally a no-op for tracking purposes;
  // actual navigation is handled by the page itself.
  const handleNavigation = useCallback((_token: string, _context?: string) => {
    // no-op — kept for API compatibility
  }, []);

  const clearSession = useCallback(() => {
    clearToken();
    setCachedValidation(null);
  }, [clearToken]);

  useEffect(() => {
    // Load cached validation on mount
    const cached = sessionStorage.getItem('token_validation');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Re-hydrate expiresAt as a Date if present
        if (parsed.expiresAt) {
          parsed.expiresAt = new Date(parsed.expiresAt);
        }
        setCachedValidation(parsed);
      } catch {
        // Invalid cache, ignore
      }
    }
  }, []);

  useEffect(() => {
    // Clear on unmount if requested
    return () => {
      if (options?.clearOnUnmount) {
        clearSession();
      }
    };
  }, [options?.clearOnUnmount, clearSession]);

  return {
    persistToken,
    clearToken,
    getToken,
    cachedValidation,
    cacheValidation,
    handleNavigation,
    clearSession,
  };
}