/**
 * Token Cleanup Hook
 *
 * React hook for managing automatic token cleanup in the application.
 * Integrates with the application lifecycle to start/stop cleanup automatically.
 */

import { useEffect, useRef, useState } from 'react';
import {
  TokenCleanupScheduler,
  getCleanupScheduler,
  getCleanupStats,
  type CleanupResult,
  type CleanupStats,
} from '@/services/tokenCleanupService';

export interface UseTokenCleanupOptions {
  /** Cleanup interval in milliseconds (default: 1 hour) */
  intervalMs?: number;
  /** Whether to start cleanup automatically (default: true) */
  autoStart?: boolean;
  /** Whether to run initial cleanup on mount (default: false) */
  runOnMount?: boolean;
}

export interface UseTokenCleanupReturn {
  /** The cleanup scheduler instance */
  scheduler: TokenCleanupScheduler;
  /** Whether the scheduler is currently running */
  isRunning: boolean;
  /** Current cleanup statistics */
  stats: CleanupStats | null;
  /** Last cleanup result */
  lastResult: CleanupResult | null;
  /** Whether a cleanup is currently in progress */
  isCleaningUp: boolean;
  /** Start the cleanup scheduler */
  start: () => void;
  /** Stop the cleanup scheduler */
  stop: () => void;
  /** Run cleanup manually */
  runCleanup: () => Promise<CleanupResult>;
  /** Refresh statistics */
  refreshStats: () => Promise<void>;
}

/**
 * Hook for managing automatic token cleanup
 */
export function useTokenCleanup(options: UseTokenCleanupOptions = {}): UseTokenCleanupReturn {
  const {
    intervalMs = 60 * 60 * 1000, // 1 hour default
    autoStart = true,
    runOnMount = false,
  } = options;

  const schedulerRef = useRef<TokenCleanupScheduler | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [lastResult, setLastResult] = useState<CleanupResult | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Initialize scheduler
  useEffect(() => {
    schedulerRef.current = getCleanupScheduler(intervalMs);
    setIsRunning(schedulerRef.current.isSchedulerRunning());
  }, [intervalMs]);

  // Load initial stats
  useEffect(() => {
    refreshStats();
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && schedulerRef.current && !schedulerRef.current.isSchedulerRunning()) {
      schedulerRef.current.start();
      setIsRunning(true);
    }
  }, [autoStart]);

  // Run initial cleanup if enabled
  useEffect(() => {
    if (runOnMount) {
      runCleanup();
    }
  }, [runOnMount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schedulerRef.current?.isSchedulerRunning()) {
        schedulerRef.current.stop();
      }
    };
  }, []);

  const start = () => {
    if (schedulerRef.current) {
      schedulerRef.current.start();
      setIsRunning(true);
    }
  };

  const stop = () => {
    if (schedulerRef.current) {
      schedulerRef.current.stop();
      setIsRunning(false);
    }
  };

  const runCleanup = async (): Promise<CleanupResult> => {
    if (!schedulerRef.current) {
      const errorResult: CleanupResult = {
        success: false,
        setupTokensDeleted: 0,
        invitationsDeleted: 0,
        error: 'Scheduler not initialized',
      };
      setLastResult(errorResult);
      return errorResult;
    }

    setIsCleaningUp(true);
    try {
      const result = await schedulerRef.current.runCleanup();
      setLastResult(result);

      // Refresh stats after cleanup
      await refreshStats();

      return result;
    } finally {
      setIsCleaningUp(false);
    }
  };

  const refreshStats = async (): Promise<void> => {
    try {
      const currentStats = await getCleanupStats();
      setStats(currentStats);
    } catch (error) {
      console.warn('Failed to refresh cleanup stats:', error);
    }
  };

  return {
    scheduler: schedulerRef.current!,
    isRunning,
    stats,
    lastResult,
    isCleaningUp,
    start,
    stop,
    runCleanup,
    refreshStats,
  };
}

/**
 * Hook for cleanup statistics only (lighter weight)
 */
export function useCleanupStats() {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = async () => {
    try {
      setLoading(true);
      const currentStats = await getCleanupStats();
      setStats(currentStats);
    } catch (error) {
      console.warn('Failed to load cleanup stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return {
    stats,
    loading,
    refreshStats,
  };
}
