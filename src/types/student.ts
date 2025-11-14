// Student types
export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  email?: string;
  phone?: string;
  needsFollowUp: boolean;
  followUpNotes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Computed fields
  interactionCount?: number;
  totalTimeSpent?: number;
}

// Database response types for Supabase
export interface StudentDbResponse {
  id: string;
  tenant_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  email?: string;
  phone?: string;
  needs_follow_up: boolean;
  follow_up_notes?: string;
  created_at: string;
  updated_at: string;
}
