/**
 * Optimized Dashboard Stats Component
 *
 * This component implements performance optimizations for dashboard statistics:
 * - Memoized calculations to prevent unnecessary re-computations
 * - Privacy-aware caching with user context
 * - Efficient data aggregation
 * - Lazy loading of detailed statistics
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Clock, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { PrivacyIndicator } from '@/components/common/PrivacyIndicator';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedInteractions } from '@/hooks/useOptimizedInteractions';
import type { Interaction } from '@/types/interaction';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface OptimizedDashboardStatsProps {
  dateRange?: { start: string; end: string };
  showDetailedStats?: boolean;
  enableRealTimeUpdates?: boolean;
}

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface DashboardMetrics {
  totalInteractions: number;
  totalStudents: number;
  totalTimeSpent: number;
  averageSessionLength: number;
  followUpsNeeded: number;
  overdueFollowUps: number;
  categoryBreakdown: Array<{
    categoryName: string;
    count: number;
    percentage: number;
    color?: string;
  }>;
  recentInteractions: Interaction[];
  weeklyTrend: number;
}

// ============================================================================
// MEMOIZED CALCULATION HOOKS
// ============================================================================

/**
 * Memoized hook for calculating dashboard metrics
 */
function useDashboardMetrics(
  interactions: Interaction[],
  dateRange?: { start: string; end: string }
): DashboardMetrics {
  return useMemo(() => {
    // Filter interactions by date range if provided
    let filteredInteractions = interactions;
    if (dateRange) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filteredInteractions = interactions.filter(interaction => {
        const interactionDate = new Date(interaction.startTime);
        return interactionDate >= startDate && interactionDate <= endDate;
      });
    }

    // Calculate basic metrics
    const totalInteractions = filteredInteractions.length;

    const uniqueStudentIds = new Set(
      filteredInteractions.filter(i => i.studentId).map(i => i.studentId as string)
    );
    const totalStudents = uniqueStudentIds.size;

    const totalTimeSpent = filteredInteractions.reduce(
      (sum, interaction) => sum + interaction.durationMinutes,
      0
    );

    const averageSessionLength =
      totalInteractions > 0 ? Math.round(totalTimeSpent / totalInteractions) : 0;

    // Calculate follow-up metrics
    const followUpsNeeded = filteredInteractions.filter(
      i => i.needsFollowUp && !i.isFollowUpComplete
    ).length;

    const now = new Date();
    const overdueFollowUps = filteredInteractions.filter(
      i =>
        i.needsFollowUp && !i.isFollowUpComplete && i.followUpDate && new Date(i.followUpDate) < now
    ).length;

    // Calculate category breakdown
    const categoryMap = new Map<string, { count: number; name: string; color?: string }>();
    filteredInteractions.forEach(interaction => {
      const categoryId = interaction.categoryId;
      const categoryName = interaction.category?.name || 'Unknown';
      const categoryColor = interaction.category?.color;

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!;
        categoryMap.set(categoryId, {
          ...existing,
          count: existing.count + 1,
        });
      } else {
        categoryMap.set(categoryId, {
          count: 1,
          name: categoryName,
          color: categoryColor,
        });
      }
    });

    const categoryBreakdown = Array.from(categoryMap.values())
      .map(category => ({
        categoryName: category.name,
        count: category.count,
        percentage:
          totalInteractions > 0 ? Math.round((category.count / totalInteractions) * 100) : 0,
        color: category.color,
      }))
      .sort((a, b) => b.count - a.count);

    // Get recent interactions (last 5)
    const recentInteractions = filteredInteractions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);

    // Calculate weekly trend (compare with previous week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeekInteractions = interactions.filter(
      i => new Date(i.startTime) >= oneWeekAgo
    ).length;
    const lastWeekInteractions = interactions.filter(
      i => new Date(i.startTime) >= twoWeeksAgo && new Date(i.startTime) < oneWeekAgo
    ).length;

    const weeklyTrend =
      lastWeekInteractions > 0
        ? Math.round(((thisWeekInteractions - lastWeekInteractions) / lastWeekInteractions) * 100)
        : 0;

    return {
      totalInteractions,
      totalStudents,
      totalTimeSpent,
      averageSessionLength,
      followUpsNeeded,
      overdueFollowUps,
      categoryBreakdown,
      recentInteractions,
      weeklyTrend,
    };
  }, [interactions, dateRange]);
}

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

/**
 * Memoized stat card component
 */
const StatCard = React.memo<{
  stat: StatCard;
  isAdmin: boolean;
}>(({ stat, isAdmin }) => {
  const Icon = stat.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
          {!isAdmin && <PrivacyIndicator type="statistics" variant="inline" />}
        </div>
        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
          <Icon className={`w-5 h-5 ${stat.iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
          {stat.trend && (
            <div
              className={`flex items-center text-sm ${
                stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className={`w-4 h-4 mr-1 ${stat.trend.isPositive ? '' : 'rotate-180'}`} />
              {Math.abs(stat.trend.value)}%
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
      </CardContent>
      <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
    </Card>
  );
});

StatCard.displayName = 'StatCard';

/**
 * Memoized category breakdown component
 */
const CategoryBreakdown = React.memo<{
  categories: Array<{
    categoryName: string;
    count: number;
    percentage: number;
    color?: string;
  }>;
}>(({ categories }) => {
  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.slice(0, 5).map((category, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color || '#6B7280' }}
              />
              <span className="text-sm font-medium">{category.categoryName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{category.count}</span>
              <span className="text-xs text-muted-foreground">({category.percentage}%)</span>
            </div>
          </div>
        ))}
        {categories.length > 5 && (
          <p className="text-xs text-muted-foreground">+{categories.length - 5} more categories</p>
        )}
      </CardContent>
    </Card>
  );
});

CategoryBreakdown.displayName = 'CategoryBreakdown';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OptimizedDashboardStats({
  dateRange,
  showDetailedStats = false,
  enableRealTimeUpdates = true,
}: OptimizedDashboardStatsProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [showDetails, setShowDetails] = useState(showDetailedStats);

  // Fetch interactions with optimized query
  const {
    data: interactionsData,
    isLoading,
    error,
  } = useOptimizedInteractions({
    limit: 1000, // Fetch more for accurate statistics
    includeNotes: false, // Don't need notes for stats
    dateRange,
    enabled: enableRealTimeUpdates,
  });

  // Calculate metrics
  const metrics = useDashboardMetrics(interactionsData?.interactions || [], dateRange);

  // Format time spent helper
  const formatTimeSpent = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  }, []);

  // Generate stat cards
  const statCards: StatCard[] = useMemo(
    () => [
      {
        title: 'Total Interactions',
        value: metrics.totalInteractions,
        description: isAdmin ? 'All counselor sessions' : 'Your counseling sessions',
        icon: MessageSquare,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        trend: {
          value: metrics.weeklyTrend,
          isPositive: metrics.weeklyTrend >= 0,
        },
      },
      {
        title: 'Students Seen',
        value: metrics.totalStudents,
        description: isAdmin ? 'Students helped by all counselors' : 'Students you have helped',
        icon: Users,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
      },
      {
        title: 'Time Spent',
        value: formatTimeSpent(metrics.totalTimeSpent),
        description: isAdmin ? 'Total counseling time (all)' : 'Your counseling time',
        icon: Clock,
        color: 'from-emerald-500 to-teal-500',
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
      },
      {
        title: 'Avg Session',
        value: `${metrics.averageSessionLength}m`,
        description: 'Average session length',
        icon: Calendar,
        color: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
      },
      {
        title: 'Follow-ups Needed',
        value: metrics.followUpsNeeded,
        description: 'Pending follow-up sessions',
        icon: AlertCircle,
        color: 'from-yellow-500 to-amber-500',
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
      },
    ],
    [metrics, isAdmin, formatTimeSpent]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
        <span className="ml-2 text-muted-foreground">Loading dashboard statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 border rounded-lg border-red-200 bg-red-50">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-red-800 font-medium">Failed to load dashboard statistics</p>
        <p className="text-red-600 text-sm mt-1">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Context Header */}
      <div className="flex items-center justify-between">
        <PrivacyIndicator type="statistics" />
        <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map(stat => (
          <StatCard key={stat.title} stat={stat} isAdmin={isAdmin} />
        ))}
      </div>

      {/* Detailed Statistics */}
      {showDetails && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <CategoryBreakdown categories={metrics.categoryBreakdown} />

          {/* Follow-up Alerts */}
          {metrics.overdueFollowUps > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Overdue Follow-ups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">
                  You have <strong>{metrics.overdueFollowUps}</strong> overdue follow-up
                  {metrics.overdueFollowUps !== 1 ? 's' : ''}
                  that need immediate attention.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Performance Metrics (Development Only) */}
      {import.meta.env.DEV && (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-xs text-gray-600">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>Interactions Loaded: {interactionsData?.interactions.length || 0}</div>
              <div>Cache Status: {isLoading ? 'Loading' : 'Cached'}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default OptimizedDashboardStats;
