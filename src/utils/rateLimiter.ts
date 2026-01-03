/**
 * Rate Limiting Utility
 *
 * Provides rate limiting functionality for invitation creation and other sensitive operations.
 * Implements both IP-based and user-based rate limiting with configurable windows and limits.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

class RateLimiter {
  private ipLimits = new Map<string, RateLimitEntry>();
  private userLimits = new Map<string, RateLimitEntry>();

  // Default configurations
  private readonly defaultIpConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 requests per 15 minutes per IP
  };

  private readonly defaultUserConfig: RateLimitConfig = {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 requests per hour per user
  };

  /**
   * Check if a request is allowed based on IP address
   */
  checkIpLimit(ipAddress: string, config: RateLimitConfig = this.defaultIpConfig): RateLimitResult {
    return this.checkLimit(this.ipLimits, ipAddress, config, 'IP');
  }

  /**
   * Check if a request is allowed based on user ID
   */
  checkUserLimit(
    userId: string,
    config: RateLimitConfig = this.defaultUserConfig
  ): RateLimitResult {
    return this.checkLimit(this.userLimits, userId, config, 'User');
  }

  /**
   * Check both IP and user limits
   */
  checkCombinedLimit(
    ipAddress: string,
    userId: string,
    ipConfig: RateLimitConfig = this.defaultIpConfig,
    userConfig: RateLimitConfig = this.defaultUserConfig
  ): RateLimitResult {
    // Check IP limit first
    const ipResult = this.checkIpLimit(ipAddress, ipConfig);
    if (!ipResult.allowed) {
      return ipResult;
    }

    // Check user limit
    const userResult = this.checkUserLimit(userId, userConfig);
    if (!userResult.allowed) {
      return userResult;
    }

    return {
      allowed: true,
      remaining: Math.min(ipResult.remaining, userResult.remaining),
      resetTime: Math.max(ipResult.resetTime, userResult.resetTime),
    };
  }

  /**
   * Generic rate limit checker
   */
  private checkLimit(
    limitMap: Map<string, RateLimitEntry>,
    key: string,
    config: RateLimitConfig,
    type: string
  ): RateLimitResult {
    const now = Date.now();
    const entry = limitMap.get(key);

    // If no entry exists or the window has expired, create/reset entry
    if (!entry || now >= entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      limitMap.set(key, newEntry);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // Check if limit is exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        error: `${type} rate limit exceeded. Try again after ${new Date(entry.resetTime).toLocaleTimeString()}.`,
      };
    }

    // Increment count and allow request
    entry.count++;
    limitMap.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();

    // Clean up IP limits
    for (const [key, entry] of this.ipLimits.entries()) {
      if (now >= entry.resetTime) {
        this.ipLimits.delete(key);
      }
    }

    // Clean up user limits
    for (const [key, entry] of this.userLimits.entries()) {
      if (now >= entry.resetTime) {
        this.userLimits.delete(key);
      }
    }
  }

  /**
   * Reset limits for a specific IP (for testing or admin override)
   */
  resetIpLimit(ipAddress: string): void {
    this.ipLimits.delete(ipAddress);
  }

  /**
   * Reset limits for a specific user (for testing or admin override)
   */
  resetUserLimit(userId: string): void {
    this.userLimits.delete(userId);
  }

  /**
   * Get current status for an IP
   */
  getIpStatus(ipAddress: string): { count: number; resetTime: number } | null {
    const entry = this.ipLimits.get(ipAddress);
    if (!entry || Date.now() >= entry.resetTime) {
      return null;
    }
    return { count: entry.count, resetTime: entry.resetTime };
  }

  /**
   * Get current status for a user
   */
  getUserStatus(userId: string): { count: number; resetTime: number } | null {
    const entry = this.userLimits.get(userId);
    if (!entry || Date.now() >= entry.resetTime) {
      return null;
    }
    return { count: entry.count, resetTime: entry.resetTime };
  }
}

// Create a singleton instance
export const rateLimiter = new RateLimiter();

// Set up periodic cleanup (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      rateLimiter.cleanup();
    },
    5 * 60 * 1000
  );
}

// Export types for use in other modules
export type { RateLimitConfig, RateLimitResult };
