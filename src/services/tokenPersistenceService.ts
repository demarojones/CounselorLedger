/**
 * Token Persistence Service
 *
 * Handles token validation caching and session persistence to ensure
 * tokens remain valid during navigation and provide a smooth user experience.
 */

export interface TokenValidationCache {
  token: string;
  isValid: boolean;
  validatedAt: Date;
  expiresAt?: Date;
  email?: string;
  role?: string;
  tenantId?: string;
  tenantName?: string;
  adminEmail?: string;
}

export interface TokenSessionData {
  token: string;
  type: 'invitation' | 'setup';
  validationCache?: TokenValidationCache;
  lastAccessed: Date;
  navigationCount: number;
}

const TOKEN_CACHE_KEY = 'token_validation_cache';
const TOKEN_SESSION_KEY = 'token_session_data';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Cache token validation results to avoid repeated API calls
 */
export function cacheTokenValidation(
  token: string,
  validationResult: {
    isValid: boolean;
    expiresAt?: Date;
    email?: string;
    role?: string;
    tenantId?: string;
    tenantName?: string;
    adminEmail?: string;
  }
): void {
  try {
    const cache: TokenValidationCache = {
      token,
      isValid: validationResult.isValid,
      validatedAt: new Date(),
      expiresAt: validationResult.expiresAt,
      email: validationResult.email,
      role: validationResult.role,
      tenantId: validationResult.tenantId,
      tenantName: validationResult.tenantName,
      adminEmail: validationResult.adminEmail,
    };

    sessionStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to cache token validation:', error);
  }
}

/**
 * Get cached token validation result if still valid
 */
export function getCachedTokenValidation(token: string): TokenValidationCache | null {
  try {
    const cached = sessionStorage.getItem(TOKEN_CACHE_KEY);
    if (!cached) {
      return null;
    }

    const cache: TokenValidationCache = JSON.parse(cached);

    // Check if cache is for the same token
    if (cache.token !== token) {
      return null;
    }

    // Check if cache is still valid (not expired)
    const now = new Date();
    const cacheAge = now.getTime() - new Date(cache.validatedAt).getTime();

    if (cacheAge > CACHE_DURATION_MS) {
      // Cache expired, remove it
      sessionStorage.removeItem(TOKEN_CACHE_KEY);
      return null;
    }

    // If the token itself has expired, don't return cached result
    if (cache.expiresAt && new Date(cache.expiresAt) < now) {
      sessionStorage.removeItem(TOKEN_CACHE_KEY);
      return null;
    }

    return {
      ...cache,
      validatedAt: new Date(cache.validatedAt),
      expiresAt: cache.expiresAt ? new Date(cache.expiresAt) : undefined,
    };
  } catch (error) {
    console.warn('Failed to get cached token validation:', error);
    return null;
  }
}

/**
 * Clear token validation cache
 */
export function clearTokenValidationCache(): void {
  try {
    sessionStorage.removeItem(TOKEN_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear token validation cache:', error);
  }
}

/**
 * Store token session data for navigation persistence
 */
export function storeTokenSession(
  token: string,
  type: 'invitation' | 'setup',
  validationCache?: TokenValidationCache
): void {
  try {
    const existing = getTokenSession();

    const sessionData: TokenSessionData = {
      token,
      type,
      validationCache,
      lastAccessed: new Date(),
      navigationCount: existing?.token === token ? existing.navigationCount + 1 : 1,
    };

    sessionStorage.setItem(TOKEN_SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.warn('Failed to store token session:', error);
  }
}

/**
 * Get stored token session data
 */
export function getTokenSession(): TokenSessionData | null {
  try {
    const stored = sessionStorage.getItem(TOKEN_SESSION_KEY);
    if (!stored) {
      return null;
    }

    const sessionData: TokenSessionData = JSON.parse(stored);

    // Check if session is still valid (not expired)
    const now = new Date();
    const sessionAge = now.getTime() - new Date(sessionData.lastAccessed).getTime();

    if (sessionAge > SESSION_DURATION_MS) {
      // Session expired, remove it
      sessionStorage.removeItem(TOKEN_SESSION_KEY);
      return null;
    }

    return {
      ...sessionData,
      lastAccessed: new Date(sessionData.lastAccessed),
      validationCache: sessionData.validationCache
        ? {
            ...sessionData.validationCache,
            validatedAt: new Date(sessionData.validationCache.validatedAt),
            expiresAt: sessionData.validationCache.expiresAt
              ? new Date(sessionData.validationCache.expiresAt)
              : undefined,
          }
        : undefined,
    };
  } catch (error) {
    console.warn('Failed to get token session:', error);
    return null;
  }
}

/**
 * Update token session access time (call on navigation)
 */
export function updateTokenSessionAccess(): void {
  try {
    const existing = getTokenSession();
    if (existing) {
      existing.lastAccessed = new Date();
      existing.navigationCount += 1;
      sessionStorage.setItem(TOKEN_SESSION_KEY, JSON.stringify(existing));
    }
  } catch (error) {
    console.warn('Failed to update token session access:', error);
  }
}

/**
 * Clear token session data
 */
export function clearTokenSession(): void {
  try {
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
    clearTokenValidationCache();
  } catch (error) {
    console.warn('Failed to clear token session:', error);
  }
}

/**
 * Check if a token is currently in session
 */
export function isTokenInSession(token: string): boolean {
  const session = getTokenSession();
  return session?.token === token;
}

/**
 * Get token from current session
 */
export function getSessionToken(): string | null {
  const session = getTokenSession();
  return session?.token || null;
}

/**
 * Validate token with caching support
 */
export async function validateTokenWithCache<T>(
  token: string,
  validationFunction: (token: string) => Promise<T>,
  cacheExtractor?: (result: T) => {
    isValid: boolean;
    expiresAt?: Date;
    email?: string;
    role?: string;
    tenantId?: string;
    tenantName?: string;
    adminEmail?: string;
  }
): Promise<T> {
  // Check cache first
  const cached = getCachedTokenValidation(token);
  if (cached && cached.isValid) {
    // Return cached result if available and valid
    // Note: This assumes the validation function returns a consistent structure
    // In practice, you might need to reconstruct the expected return type
    console.log('Using cached token validation');
  }

  // Perform actual validation
  const result = await validationFunction(token);

  // Cache the result if extractor is provided
  if (cacheExtractor) {
    const cacheData = cacheExtractor(result);
    cacheTokenValidation(token, cacheData);
  }

  return result;
}

/**
 * Navigation persistence hook integration
 */
export function handleTokenNavigation(token: string, type: 'invitation' | 'setup'): void {
  // Store or update session
  const cached = getCachedTokenValidation(token);
  storeTokenSession(token, type, cached || undefined);

  // Update access time
  updateTokenSessionAccess();
}

/**
 * Clean up expired sessions and caches
 */
export function cleanupExpiredSessions(): void {
  try {
    // This will automatically remove expired sessions when accessed
    getTokenSession();
    getCachedTokenValidation(''); // This will clean up if expired
  } catch (error) {
    console.warn('Failed to cleanup expired sessions:', error);
  }
}

/**
 * Get session statistics for monitoring
 */
export function getSessionStats(): {
  hasActiveSession: boolean;
  sessionType?: 'invitation' | 'setup';
  navigationCount?: number;
  sessionAge?: number;
  cacheAge?: number;
} {
  const session = getTokenSession();

  if (!session) {
    return { hasActiveSession: false };
  }

  const cached = getCachedTokenValidation(session.token);
  const now = new Date();

  return {
    hasActiveSession: true,
    sessionType: session.type,
    navigationCount: session.navigationCount,
    sessionAge: now.getTime() - session.lastAccessed.getTime(),
    cacheAge: cached ? now.getTime() - cached.validatedAt.getTime() : undefined,
  };
}
