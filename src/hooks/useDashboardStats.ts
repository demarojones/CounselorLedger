import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Interaction } from '@/types/interaction';
import type { DashboardStats } from '@/types/dashboard';

interface UseDashboardStatsOptions {
  interactions: Interaction[];
  startDate?: Date;
  endDate?: Date;
}

export function useDashboardStats({
  interactions,
  startDate,
  endDate,
}: UseDashboardStatsOptions): DashboardStats {
  const { user } = useAuth();

  return useMemo(() => {
    // Filter interactions by date range
    let filteredInteractions = interactions;

    if (startDate || endDate) {
      filteredInteractions = interactions.filter((interaction) => {
        const interactionDate = new Date(interaction.startTime);
        if (startDate && interactionDate < startDate) return false;
        if (endDate && interactionDate > endDate) return false;
        return true;
      });
    }

    // Filter by role: counselors see only their own data, admins see all
    if (user?.role === 'COUNSELOR') {
      filteredInteractions = filteredInteractions.filter(
        (interaction) => interaction.counselorId === user.id
      );
    }

    // Calculate total interactions
    const totalInteractions = filteredInteractions.length;

    // Calculate unique students
    const uniqueStudentIds = new Set(
      filteredInteractions
        .filter((i) => i.studentId)
        .map((i) => i.studentId as string)
    );
    const totalStudents = uniqueStudentIds.size;

    // Calculate total time spent
    const totalTimeSpent = filteredInteractions.reduce(
      (sum, interaction) => sum + interaction.durationMinutes,
      0
    );

    // Calculate category breakdown
    const categoryMap = new Map<
      string,
      { count: number; name: string; color?: string }
    >();

    filteredInteractions.forEach((interaction) => {
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
      .map((category) => ({
        categoryName: category.name,
        count: category.count,
        percentage:
          totalInteractions > 0
            ? Math.round((category.count / totalInteractions) * 100)
            : 0,
        color: category.color,
      }))
      .sort((a, b) => b.count - a.count);

    // Get recent interactions (limit to 10)
    const recentInteractions = filteredInteractions.slice(0, 10);

    return {
      totalInteractions,
      totalStudents,
      totalTimeSpent,
      categoryBreakdown,
      recentInteractions,
    };
  }, [interactions, startDate, endDate, user]);
}
