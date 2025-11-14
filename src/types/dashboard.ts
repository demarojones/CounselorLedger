import type { Interaction } from './interaction';

// Dashboard statistics types
export interface CategoryBreakdown {
  categoryName: string;
  percentage: number;
  count: number;
  color?: string;
}

export interface DashboardStats {
  totalInteractions: number;
  totalStudents: number;
  totalTimeSpent: number;
  categoryBreakdown: CategoryBreakdown[];
  recentInteractions: Interaction[];
}

// Report filter types
export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  gradeLevel?: string;
  categoryId?: string;
  counselorId?: string;
}

// Report data types
export interface VolumeReportData {
  totalStudents: number;
  byGradeLevel: {
    gradeLevel: string;
    count: number;
  }[];
  trend: {
    date: Date;
    count: number;
  }[];
}

export interface FrequencyReportData {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  interactionCount: number;
  totalTimeSpent: number;
}

export interface GradeLevelReportData {
  gradeLevel: string;
  interactionCount: number;
  percentage: number;
}

export interface TimeAllocationReportData {
  byCategory: {
    categoryName: string;
    totalMinutes: number;
    percentage: number;
  }[];
  byGradeLevel: {
    gradeLevel: string;
    totalMinutes: number;
    percentage: number;
  }[];
  byStudent: {
    studentId: string;
    studentName: string;
    totalMinutes: number;
  }[];
}
