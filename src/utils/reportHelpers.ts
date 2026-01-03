/**
 * Data aggregation and report utility functions
 */

import type { Interaction } from '@/types/interaction';

/**
 * Group interactions by a specific field
 */
export function groupBy<T>(
  items: T[],
  keyGetter: (item: T) => string | number
): Map<string | number, T[]> {
  const map = new Map<string | number, T[]>();

  items.forEach(item => {
    const key = keyGetter(item);
    const collection = map.get(key);

    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });

  return map;
}

/**
 * Calculate total duration from interactions
 */
export function calculateTotalDuration(interactions: Interaction[]): number {
  return interactions.reduce((total, interaction) => {
    return total + (interaction.durationMinutes || 0);
  }, 0);
}

/**
 * Count unique students from interactions
 */
export function countUniqueStudents(interactions: Interaction[]): number {
  const uniqueStudentIds = new Set(interactions.filter(i => i.studentId).map(i => i.studentId));

  return uniqueStudentIds.size;
}

/**
 * Count unique contacts from interactions
 */
export function countUniqueContacts(interactions: Interaction[]): number {
  const uniqueContactIds = new Set(interactions.filter(i => i.contactId).map(i => i.contactId));

  return uniqueContactIds.size;
}

/**
 * Group interactions by category and calculate percentages
 */
export function calculateCategoryBreakdown(interactions: Interaction[]): Array<{
  categoryId: string;
  categoryName: string;
  count: number;
  percentage: number;
  totalDuration: number;
}> {
  if (interactions.length === 0) {
    return [];
  }

  const categoryMap = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      count: number;
      totalDuration: number;
    }
  >();

  interactions.forEach(interaction => {
    const categoryId = interaction.categoryId || 'unknown';
    const categoryName = interaction.category?.name || 'Unknown';

    const existing = categoryMap.get(categoryId);

    if (existing) {
      existing.count++;
      existing.totalDuration += interaction.durationMinutes || 0;
    } else {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName,
        count: 1,
        totalDuration: interaction.durationMinutes || 0,
      });
    }
  });

  const total = interactions.length;

  return Array.from(categoryMap.values())
    .map(item => ({
      ...item,
      percentage: Math.round((item.count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Group interactions by grade level
 */
export function groupByGradeLevel(interactions: Interaction[]): Array<{
  gradeLevel: string;
  count: number;
  percentage: number;
  totalDuration: number;
}> {
  if (interactions.length === 0) {
    return [];
  }

  const gradeMap = new Map<
    string,
    {
      count: number;
      totalDuration: number;
    }
  >();

  interactions.forEach(interaction => {
    const gradeLevel = interaction.student?.gradeLevel || 'Unknown';

    const existing = gradeMap.get(gradeLevel);

    if (existing) {
      existing.count++;
      existing.totalDuration += interaction.durationMinutes || 0;
    } else {
      gradeMap.set(gradeLevel, {
        count: 1,
        totalDuration: interaction.durationMinutes || 0,
      });
    }
  });

  const total = interactions.length;

  return Array.from(gradeMap.entries())
    .map(([gradeLevel, data]) => ({
      gradeLevel,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
      totalDuration: data.totalDuration,
    }))
    .sort((a, b) => {
      // Sort by grade level numerically if possible
      const aNum = parseInt(a.gradeLevel);
      const bNum = parseInt(b.gradeLevel);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }

      return a.gradeLevel.localeCompare(b.gradeLevel);
    });
}

/**
 * Calculate student frequency (students seen most often)
 */
export function calculateStudentFrequency(interactions: Interaction[]): Array<{
  studentId: string;
  studentName: string;
  gradeLevel: string;
  interactionCount: number;
  totalDuration: number;
}> {
  const studentMap = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      gradeLevel: string;
      interactionCount: number;
      totalDuration: number;
    }
  >();

  interactions.forEach(interaction => {
    if (!interaction.studentId || !interaction.student) {
      return;
    }

    const studentId = interaction.studentId;
    const existing = studentMap.get(studentId);

    if (existing) {
      existing.interactionCount++;
      existing.totalDuration += interaction.durationMinutes || 0;
    } else {
      studentMap.set(studentId, {
        studentId,
        studentName: `${interaction.student.firstName} ${interaction.student.lastName}`,
        gradeLevel: interaction.student.gradeLevel || 'Unknown',
        interactionCount: 1,
        totalDuration: interaction.durationMinutes || 0,
      });
    }
  });

  return Array.from(studentMap.values()).sort((a, b) => b.interactionCount - a.interactionCount);
}

/**
 * Calculate time allocation by category
 */
export function calculateTimeAllocationByCategory(interactions: Interaction[]): Array<{
  categoryName: string;
  totalMinutes: number;
  percentage: number;
  interactionCount: number;
}> {
  if (interactions.length === 0) {
    return [];
  }

  const categoryMap = new Map<
    string,
    {
      totalMinutes: number;
      interactionCount: number;
    }
  >();

  let totalMinutes = 0;

  interactions.forEach(interaction => {
    const categoryName = interaction.category?.name || 'Unknown';
    const duration = interaction.durationMinutes || 0;

    totalMinutes += duration;

    const existing = categoryMap.get(categoryName);

    if (existing) {
      existing.totalMinutes += duration;
      existing.interactionCount++;
    } else {
      categoryMap.set(categoryName, {
        totalMinutes: duration,
        interactionCount: 1,
      });
    }
  });

  return Array.from(categoryMap.entries())
    .map(([categoryName, data]) => ({
      categoryName,
      totalMinutes: data.totalMinutes,
      percentage: totalMinutes > 0 ? Math.round((data.totalMinutes / totalMinutes) * 100) : 0,
      interactionCount: data.interactionCount,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/**
 * Calculate time allocation by grade level
 */
export function calculateTimeAllocationByGrade(interactions: Interaction[]): Array<{
  gradeLevel: string;
  totalMinutes: number;
  percentage: number;
  interactionCount: number;
}> {
  if (interactions.length === 0) {
    return [];
  }

  const gradeMap = new Map<
    string,
    {
      totalMinutes: number;
      interactionCount: number;
    }
  >();

  let totalMinutes = 0;

  interactions.forEach(interaction => {
    const gradeLevel = interaction.student?.gradeLevel || 'Unknown';
    const duration = interaction.durationMinutes || 0;

    totalMinutes += duration;

    const existing = gradeMap.get(gradeLevel);

    if (existing) {
      existing.totalMinutes += duration;
      existing.interactionCount++;
    } else {
      gradeMap.set(gradeLevel, {
        totalMinutes: duration,
        interactionCount: 1,
      });
    }
  });

  return Array.from(gradeMap.entries())
    .map(([gradeLevel, data]) => ({
      gradeLevel,
      totalMinutes: data.totalMinutes,
      percentage: totalMinutes > 0 ? Math.round((data.totalMinutes / totalMinutes) * 100) : 0,
      interactionCount: data.interactionCount,
    }))
    .sort((a, b) => {
      // Sort by grade level numerically if possible
      const aNum = parseInt(a.gradeLevel);
      const bNum = parseInt(b.gradeLevel);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }

      return a.gradeLevel.localeCompare(b.gradeLevel);
    });
}

/**
 * Calculate top students by time spent
 */
export function calculateTopStudentsByTime(
  interactions: Interaction[],
  limit = 20
): Array<{
  studentId: string;
  studentName: string;
  gradeLevel: string;
  totalMinutes: number;
  interactionCount: number;
}> {
  const studentMap = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      gradeLevel: string;
      totalMinutes: number;
      interactionCount: number;
    }
  >();

  interactions.forEach(interaction => {
    if (!interaction.studentId || !interaction.student) {
      return;
    }

    const studentId = interaction.studentId;
    const duration = interaction.durationMinutes || 0;
    const existing = studentMap.get(studentId);

    if (existing) {
      existing.totalMinutes += duration;
      existing.interactionCount++;
    } else {
      studentMap.set(studentId, {
        studentId,
        studentName: `${interaction.student.firstName} ${interaction.student.lastName}`,
        gradeLevel: interaction.student.gradeLevel || 'Unknown',
        totalMinutes: duration,
        interactionCount: 1,
      });
    }
  });

  return Array.from(studentMap.values())
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, limit);
}

/**
 * Calculate average duration per interaction
 */
export function calculateAverageDuration(interactions: Interaction[]): number {
  if (interactions.length === 0) {
    return 0;
  }

  const total = calculateTotalDuration(interactions);
  return Math.round(total / interactions.length);
}

/**
 * Filter interactions by date range
 */
export function filterByDateRange(
  interactions: Interaction[],
  startDate: Date,
  endDate: Date
): Interaction[] {
  return interactions.filter(interaction => {
    const interactionDate = new Date(interaction.startTime);
    return interactionDate >= startDate && interactionDate <= endDate;
  });
}

/**
 * Filter interactions by grade level
 */
export function filterByGradeLevel(
  interactions: Interaction[],
  gradeLevels: string[]
): Interaction[] {
  if (gradeLevels.length === 0) {
    return interactions;
  }

  return interactions.filter(interaction => {
    const gradeLevel = interaction.student?.gradeLevel;
    return gradeLevel && gradeLevels.includes(gradeLevel);
  });
}

/**
 * Filter interactions by category
 */
export function filterByCategory(
  interactions: Interaction[],
  categoryIds: string[]
): Interaction[] {
  if (categoryIds.length === 0) {
    return interactions;
  }

  return interactions.filter(interaction => {
    return interaction.categoryId && categoryIds.includes(interaction.categoryId);
  });
}

/**
 * Filter interactions by counselor
 */
export function filterByCounselor(
  interactions: Interaction[],
  counselorIds: string[]
): Interaction[] {
  if (counselorIds.length === 0) {
    return interactions;
  }

  return interactions.filter(interaction => {
    return interaction.counselorId && counselorIds.includes(interaction.counselorId);
  });
}

/**
 * Calculate trend data over time (by day, week, or month)
 */
export function calculateTrendData(
  interactions: Interaction[],
  groupBy: 'day' | 'week' | 'month' = 'day'
): Array<{
  date: string;
  count: number;
  totalDuration: number;
}> {
  const trendMap = new Map<
    string,
    {
      count: number;
      totalDuration: number;
    }
  >();

  interactions.forEach(interaction => {
    const date = new Date(interaction.startTime);
    let key: string;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    const existing = trendMap.get(key);

    if (existing) {
      existing.count++;
      existing.totalDuration += interaction.durationMinutes || 0;
    } else {
      trendMap.set(key, {
        count: 1,
        totalDuration: interaction.durationMinutes || 0,
      });
    }
  });

  return Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      totalDuration: data.totalDuration,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate summary statistics
 */
export function calculateSummaryStats(interactions: Interaction[]): {
  totalInteractions: number;
  totalStudents: number;
  totalContacts: number;
  totalDuration: number;
  averageDuration: number;
  mostCommonCategory: string | null;
  mostCommonGrade: string | null;
} {
  const totalInteractions = interactions.length;
  const totalStudents = countUniqueStudents(interactions);
  const totalContacts = countUniqueContacts(interactions);
  const totalDuration = calculateTotalDuration(interactions);
  const averageDuration = calculateAverageDuration(interactions);

  const categoryBreakdown = calculateCategoryBreakdown(interactions);
  const mostCommonCategory =
    categoryBreakdown.length > 0 ? categoryBreakdown[0].categoryName : null;

  const gradeBreakdown = groupByGradeLevel(interactions);
  const mostCommonGrade = gradeBreakdown.length > 0 ? gradeBreakdown[0].gradeLevel : null;

  return {
    totalInteractions,
    totalStudents,
    totalContacts,
    totalDuration,
    averageDuration,
    mostCommonCategory,
    mostCommonGrade,
  };
}
