/**
 * Token Cleanup Service
 *
 * Handles automatic cleanup of expired tokens including setup tokens
 * and invitation tokens. Provides background job scheduling and monitoring.
 */

import { supabase } from './supabase';
import { handleSupabaseError, type SupabaseResponse } from './supabaseHelpers';

export interface CleanupResult {
  success: boolean;
  setupTokensDeleted: number;
  invitationsDeleted: number;
  error?: string;
}

export interface CleanupStats {
  lastCleanup: Date | null;
  totalSetupTokensDeleted: number;
  totalInvitationsDeleted: number;
  cleanupCount: number;
}

/**
 * Clean up expired setup tokens and invitations
 */
export async function cleanupExpiredTokens(): Promise<SupabaseResponse<CleanupResult>> {
  try {
    const now = new Date().toISOString();

    // Clean up expired setup tokens
    const { data: setupTokensData, error: setupError } = await supabase
      .from('setup_tokens')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (setupError) {
      console.error('Failed to cleanup expired setup tokens:', setupError);
      return {
        data: {
          success: false,
          setupTokensDeleted: 0,
          invitationsDeleted: 0,
          error: 'Failed to cleanup expired setup tokens',
        },
        error: handleSupabaseError(setupError),
      };
    }

    // Clean up expired invitations
    const { data: invitationsData, error: invitationsError } = await supabase
      .from('invitations')
      .delete()
      .lt('expires_at', now)
      .is('accepted_at', null)
      .select('id');

    if (invitationsError) {
      console.error('Failed to cleanup expired invitations:', invitationsError);
      return {
        data: {
          success: false,
          setupTokensDeleted: setupTokensData?.length || 0,
          invitationsDeleted: 0,
          error: 'Failed to cleanup expired invitations',
        },
        error: handleSupabaseError(invitationsError),
      };
    }

    const setupTokensDeleted = setupTokensData?.length || 0;
    const invitationsDeleted = invitationsData?.length || 0;

    // Log cleanup results
    if (setupTokensDeleted > 0 || invitationsDeleted > 0) {
      console.log(
        `Token cleanup completed: ${setupTokensDeleted} setup tokens, ${invitationsDeleted} invitations deleted`
      );
    }

    // Update cleanup statistics
    await updateCleanupStats(setupTokensDeleted, invitationsDeleted);

    return {
      data: {
        success: true,
        setupTokensDeleted,
        invitationsDeleted,
      },
      error: null,
    };
  } catch (error) {
    console.error('Token cleanup failed:', error);
    return {
      data: {
        success: false,
        setupTokensDeleted: 0,
        invitationsDeleted: 0,
        error: 'Token cleanup failed',
      },
      error: {
        code: 'CLEANUP_ERROR',
        message: error instanceof Error ? error.message : 'Token cleanup failed',
      },
    };
  }
}

/**
 * Get cleanup statistics
 */
export async function getCleanupStats(): Promise<CleanupStats> {
  try {
    const stats = localStorage.getItem('token_cleanup_stats');
    if (stats) {
      const parsed = JSON.parse(stats);
      return {
        ...parsed,
        lastCleanup: parsed.lastCleanup ? new Date(parsed.lastCleanup) : null,
      };
    }
  } catch (error) {
    console.warn('Failed to load cleanup stats:', error);
  }

  return {
    lastCleanup: null,
    totalSetupTokensDeleted: 0,
    totalInvitationsDeleted: 0,
    cleanupCount: 0,
  };
}

/**
 * Update cleanup statistics
 */
async function updateCleanupStats(
  setupTokensDeleted: number,
  invitationsDeleted: number
): Promise<void> {
  try {
    const currentStats = await getCleanupStats();
    const newStats: CleanupStats = {
      lastCleanup: new Date(),
      totalSetupTokensDeleted: currentStats.totalSetupTokensDeleted + setupTokensDeleted,
      totalInvitationsDeleted: currentStats.totalInvitationsDeleted + invitationsDeleted,
      cleanupCount: currentStats.cleanupCount + 1,
    };

    localStorage.setItem('token_cleanup_stats', JSON.stringify(newStats));
  } catch (error) {
    console.warn('Failed to update cleanup stats:', error);
  }
}

/**
 * Background cleanup scheduler
 */
export class TokenCleanupScheduler {
  private intervalId: number | null = null;
  private isRunning = false;
  private intervalMs: number;

  constructor(intervalMs: number = 60 * 60 * 1000) {
    this.intervalMs = intervalMs; // Default 1 hour
  }

  /**
   * Start the background cleanup scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Token cleanup scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log(
      `Starting token cleanup scheduler with ${this.intervalMs / 1000 / 60} minute intervals`
    );

    // Run initial cleanup
    this.runCleanup();

    // Schedule periodic cleanup
    this.intervalId = window.setInterval(() => {
      this.runCleanup();
    }, this.intervalMs);
  }

  /**
   * Stop the background cleanup scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('Token cleanup scheduler stopped');
  }

  /**
   * Check if the scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the current interval in milliseconds
   */
  getInterval(): number {
    return this.intervalMs;
  }

  /**
   * Update the cleanup interval (requires restart to take effect)
   */
  setInterval(intervalMs: number): void {
    this.intervalMs = intervalMs;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<CleanupResult> {
    try {
      const result = await cleanupExpiredTokens();

      if (result.error || !result.data?.success) {
        console.error(
          'Scheduled token cleanup failed:',
          result.error?.message || result.data?.error
        );
        return (
          result.data || {
            success: false,
            setupTokensDeleted: 0,
            invitationsDeleted: 0,
            error: 'Cleanup failed',
          }
        );
      }

      return result.data;
    } catch (error) {
      console.error('Scheduled token cleanup error:', error);
      return {
        success: false,
        setupTokensDeleted: 0,
        invitationsDeleted: 0,
        error: error instanceof Error ? error.message : 'Cleanup error',
      };
    }
  }
}

// Global scheduler instance
let globalScheduler: TokenCleanupScheduler | null = null;

/**
 * Get or create the global cleanup scheduler
 */
export function getCleanupScheduler(intervalMs?: number): TokenCleanupScheduler {
  if (!globalScheduler) {
    globalScheduler = new TokenCleanupScheduler(intervalMs);
  }
  return globalScheduler;
}

/**
 * Start automatic token cleanup with default settings
 */
export function startAutomaticCleanup(intervalMs?: number): TokenCleanupScheduler {
  const scheduler = getCleanupScheduler(intervalMs);
  scheduler.start();
  return scheduler;
}

/**
 * Stop automatic token cleanup
 */
export function stopAutomaticCleanup(): void {
  if (globalScheduler) {
    globalScheduler.stop();
  }
}

/**
 * Check if automatic cleanup is running
 */
export function isAutomaticCleanupRunning(): boolean {
  return globalScheduler?.isSchedulerRunning() || false;
}

/**
 * Force run cleanup immediately
 */
export async function forceCleanup(): Promise<CleanupResult> {
  const scheduler = getCleanupScheduler();
  return await scheduler.runCleanup();
}
