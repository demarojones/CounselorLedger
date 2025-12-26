import type { User } from './user';
import type { Student } from './student';
import type { Contact } from './contact';
import type { ReasonCategory, ReasonSubcategory } from './reason';

// Interaction types
export interface Interaction {
  id: string;
  counselorId: string;
  studentId?: string;
  contactId?: string;
  regardingStudentId?: string; // NEW: For contact interactions - which student is this about
  categoryId: string;
  subcategoryId?: string;
  customReason?: string;
  startTime: Date;
  durationMinutes: number;
  endTime: Date;
  notes?: string;
  needsFollowUp: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  isFollowUpComplete: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Populated relations
  counselor?: User;
  student?: Student;
  contact?: Contact;
  regardingStudent?: Student; // NEW: The student this contact interaction is about
  category?: ReasonCategory;
  subcategory?: ReasonSubcategory;
}

export interface InteractionFormData {
  type: 'student' | 'contact';
  studentId?: string;
  contactId?: string;
  regardingStudentId?: string; // NEW: For contact interactions - which student is this about
  categoryId: string;
  subcategoryId?: string;
  customReason?: string;
  startTime: string;
  durationMinutes: number;
  notes?: string;
  needsFollowUp: boolean;
  followUpDate?: string;
  followUpNotes?: string;
}

// Database response types for Supabase
export interface InteractionDbResponse {
  id: string;
  tenant_id: string;
  counselor_id: string;
  student_id?: string;
  contact_id?: string;
  regarding_student_id?: string; // NEW: For contact interactions
  category_id: string;
  subcategory_id?: string;
  custom_reason?: string;
  start_time: string;
  duration_minutes: number;
  end_time: string;
  notes?: string;
  needs_follow_up: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  is_follow_up_complete: boolean;
  created_at: string;
  updated_at: string;
}
