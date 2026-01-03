/**
 * Token Security Utilities
 *
 * Provides enhanced security features for token generation, validation, and manipulation detection.
 * Implements cryptographic token validation and secure storage mechanisms.
 */

/**
 * Token validation result interface
 */
interface TokenValidationResult {
  isValid: boolean;
  isSecure: boolean;
  entropy: number;
  error?: string;
}

/**
 * Token metadata for enhanced security
 */
interface TokenMetadata {
  timestamp: number;
  entropy: number;
  checksum: string;
}

/**
 * Enhanced secure token generation with metadata
 */
export function generateSecureTokenWithMetadata(): { token: string; metadata: TokenMetadata } {
  // Generate cryptographically secure random bytes
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);

  // Convert to hex string
  const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');

  // Calculate entropy (should be close to 8 bits per byte for good randomness)
  const entropy = calculateEntropy(tokenBytes);

  // Create timestamp
  const timestamp = Date.now();

  // Generate checksum for integrity verification
  const checksum = generateChecksum(token, timestamp);

  return {
    token,
    metadata: {
      timestamp,
      entropy,
      checksum,
    },
  };
}

/**
 * Enhanced secure token hashing with salt
 */
export async function hashTokenSecurely(token: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder();

  // Use provided salt or generate one
  const actualSalt = salt || generateSalt();

  // Combine token with salt
  const combined = token + actualSalt;
  const data = encoder.encode(combined);

  // Use SHA-256 for hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Return hash with salt prefix for verification
  return `${actualSalt}:${hash}`;
}

/**
 * Verify a token against its secure hash
 */
export async function verifyTokenHash(token: string, hashedToken: string): Promise<boolean> {
  try {
    const [salt, expectedHash] = hashedToken.split(':');
    if (!salt || !expectedHash) {
      return false;
    }

    const computedHash = await hashTokenSecurely(token, salt);
    const [, actualHash] = computedHash.split(':');

    return actualHash === expectedHash;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

/**
 * Validate token cryptographic strength
 */
export function validateTokenSecurity(token: string): TokenValidationResult {
  if (!token || typeof token !== 'string') {
    return {
      isValid: false,
      isSecure: false,
      entropy: 0,
      error: 'Token is required and must be a string',
    };
  }

  // Check minimum length (should be at least 32 characters for 128-bit security)
  if (token.length < 32) {
    return {
      isValid: false,
      isSecure: false,
      entropy: 0,
      error: 'Token is too short (minimum 32 characters required)',
    };
  }

  // Check if token is hexadecimal
  const hexPattern = /^[0-9a-f]+$/i;
  if (!hexPattern.test(token)) {
    return {
      isValid: false,
      isSecure: false,
      entropy: 0,
      error: 'Token must be hexadecimal',
    };
  }

  // Convert hex to bytes for entropy calculation
  const bytes = new Uint8Array(token.length / 2);
  for (let i = 0; i < token.length; i += 2) {
    bytes[i / 2] = parseInt(token.substr(i, 2), 16);
  }

  // Calculate entropy
  const entropy = calculateEntropy(bytes);

  // Check entropy threshold (should be > 7.5 for good randomness)
  const isSecure = entropy > 7.5;

  return {
    isValid: true,
    isSecure,
    entropy,
    error: isSecure ? undefined : 'Token has low entropy (possible weak randomness)',
  };
}

/**
 * Detect potential token manipulation
 */
export function detectTokenManipulation(
  originalToken: string,
  receivedToken: string,
  metadata?: TokenMetadata
): { isManipulated: boolean; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let confidence = 0;

  // Check if tokens are identical
  if (originalToken !== receivedToken) {
    reasons.push('Token content has been modified');
    confidence += 0.9;
  }

  // Check token length consistency
  if (originalToken.length !== receivedToken.length) {
    reasons.push('Token length has been altered');
    confidence += 0.8;
  }

  // Check character set consistency
  const originalHex = /^[0-9a-f]+$/i.test(originalToken);
  const receivedHex = /^[0-9a-f]+$/i.test(receivedToken);

  if (originalHex !== receivedHex) {
    reasons.push('Token character set has been altered');
    confidence += 0.7;
  }

  // Check entropy if metadata is available
  if (metadata) {
    const receivedBytes = new Uint8Array(receivedToken.length / 2);
    for (let i = 0; i < receivedToken.length; i += 2) {
      receivedBytes[i / 2] = parseInt(receivedToken.substr(i, 2), 16);
    }

    const receivedEntropy = calculateEntropy(receivedBytes);
    const entropyDifference = Math.abs(metadata.entropy - receivedEntropy);

    if (entropyDifference > 0.5) {
      reasons.push('Token entropy has changed significantly');
      confidence += 0.6;
    }

    // Verify checksum if available
    const expectedChecksum = generateChecksum(receivedToken, metadata.timestamp);
    if (expectedChecksum !== metadata.checksum) {
      reasons.push('Token checksum verification failed');
      confidence += 0.9;
    }
  }

  return {
    isManipulated: confidence > 0.5,
    confidence: Math.min(confidence, 1.0),
    reasons,
  };
}

/**
 * Generate a cryptographically secure salt
 */
function generateSalt(): string {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  return Array.from(saltBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate Shannon entropy of a byte array
 */
function calculateEntropy(bytes: Uint8Array): number {
  const frequency = new Array(256).fill(0);

  // Count frequency of each byte value
  for (const byte of bytes) {
    frequency[byte]++;
  }

  // Calculate entropy
  let entropy = 0;
  const length = bytes.length;

  for (const count of frequency) {
    if (count > 0) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }
  }

  return entropy;
}

/**
 * Generate a checksum for token integrity verification
 */
function generateChecksum(token: string, timestamp: number): string {
  const combined = `${token}:${timestamp}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Secure token comparison to prevent timing attacks
 */
export function secureTokenCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Check if a token has expired based on its embedded timestamp
 */
export function isTokenExpired(metadata: TokenMetadata, maxAgeMs: number): boolean {
  const now = Date.now();
  return now - metadata.timestamp > maxAgeMs;
}

/**
 * Generate a time-based token that includes expiration information
 */
export function generateTimeBoundToken(expirationMs: number): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + expirationMs;
  const tokenData = generateSecureTokenWithMetadata();

  // Embed expiration time in the token (this is just for demonstration)
  const combinedToken = `${tokenData.token}${expiresAt.toString(16)}`;

  return {
    token: combinedToken,
    expiresAt,
  };
}

/**
 * Validate a time-bound token
 */
export function validateTimeBoundToken(token: string): {
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: number;
} {
  try {
    // Extract expiration time from token (last 16 characters as hex timestamp)
    if (token.length < 48) {
      // 32 chars for token + 16 for timestamp
      return { isValid: false, isExpired: false };
    }

    const timestampHex = token.slice(-16);
    const actualToken = token.slice(0, -16);
    const expiresAt = parseInt(timestampHex, 16);

    if (isNaN(expiresAt)) {
      return { isValid: false, isExpired: false };
    }

    const isExpired = Date.now() > expiresAt;
    const tokenValidation = validateTokenSecurity(actualToken);

    return {
      isValid: tokenValidation.isValid && tokenValidation.isSecure,
      isExpired,
      expiresAt,
    };
  } catch (error) {
    return { isValid: false, isExpired: false };
  }
}
