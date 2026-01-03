import { useState } from 'react';
import { useInteractions } from '@/hooks/useInteractions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
  DashboardStats,
  InteractionChart,
  RecentActivity,
  DateRangeFilter,
} from '@/components/dashboard';
import { PageTransition, DashboardSkeleton } from '@/components/common';

export function Dashboard() {
  // Default to last 30 days
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate };
  });

  const { interactions, isLoading, error } = useInteractions();

  const stats = useDashboardStats({
    interactions,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="page-container">
          <DashboardSkeleton />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <p className="text-destructive">Error loading dashboard: {error}</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="page-container section-spacing">
        <div>
          <h1 className="heading-1">Dashboard</h1>
          <p className="mt-2 body-text-sm">Overview of your counseling activities and statistics</p>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Statistics Cards */}
        <DashboardStats
          totalInteractions={stats.totalInteractions}
          totalStudents={stats.totalStudents}
          totalTimeSpent={stats.totalTimeSpent}
        />

        {/* Charts and Activity */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <InteractionChart categoryBreakdown={stats.categoryBreakdown} />
          <RecentActivity interactions={stats.recentInteractions} />
        </div>
      </div>
    </PageTransition>
  );
}
