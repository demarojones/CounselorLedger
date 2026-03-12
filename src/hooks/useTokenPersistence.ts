import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface TokenValidation {
  isValid: boolean;
  tenantId?: string;
  email?: string;
  token?: string;
  tenantName?: string;
  adminEmail?: string;
  expiresAt?: string;
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
  const navigate = useNavigate();
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

  const cacheValidation = useCallback((validation: TokenValidation, _token?: string) => {
    setCachedValidation(validation);
    sessionStorage.setItem('token_validation', JSON.stringify(validation));
  }, []);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const clearSession = useCallback(() => {
    clearToken();
    setCachedValidation(null);
  }, [clearToken]);

  useEffect(() => {
    // Load cached validation on mount
    const cached = sessionStorage.getItem('token_validation');
    if (cached) {
      try {
        setCachedValidation(JSON.parse(cached));
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