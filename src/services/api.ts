/**
 * API Service Layer
 *
 * High-level API for managing contacts, students, and interactions.
 * Handles data transformation, validation, and Supabase operations.
 */

import { supabase } from './supabase';
import {
  getTenantContext,
  handleSupabaseError,
  validateTenantOperation,
  type SupabaseResponse,
  type TenantContext,
} from './supabaseHelpers';
import {
  logInteractionAccess,
  logPrivacyViolation,
  logBulkInteractionAccess,
  logInteractionSearch,
} from './auditService';
import type { Student, StudentDbResponse } from '@/types/student';
import type { Contact, ContactDbResponse } from '@/types/contact';
import type { Interaction, InteractionFormData, InteractionDbResponse } from '@/types/interaction';

// ============================================================================
// ACCESS CONTROL VALIDATION
// ============================================================================

/**
 * Validate interaction access permissions
 */
async function validateInteractionAccess(
  interactionId: string,
  operation: 'read' | 'update' | 'delete',
  context?: TenantContext
): Promise<{ isValid: boolean; error?: SupabaseResponse<null>['error'] }> {
  try {
    const tenantContext = context || (await getTenantContext());
    if (!tenantContext) {
      return {
        isValid: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    // Fetch the interaction to check ownership
    const { data: interaction, error } = await supabase
      .from('interactions')
      .select('counselor_id, tenant_id')
      .eq('id', interactionId)
      .single();

    if (error) {
      return {
        isValid: false,
        error: handleSupabaseError(error),
      };
    }

    if (!interaction) {
      return {
        isValid: false,
        error: {
          code: 'INTERACTION_NOT_FOUND',
          message:
            'The requested interaction was not found or you do not have permission to access it.',
        },
      };
    }

    // Check tenant boundary
    if (interaction.tenant_id !== tenantContext.tenantId) {
      return {
        isValid: false,
        error: {
          code: 'PRIVACY_VIOLATION',
          message: 'Access denied: interaction belongs to different tenant',
        },
      };
    }

    // Check counselor ownership (admins can access all interactions in their tenant)
    if (tenantContext.userRole !== 'ADMIN' && interaction.counselor_id !== tenantContext.userId) {
      return {
        isValid: false,
        error: {
          code: 'CROSS_COUNSELOR_ACCESS_DENIED',
          message: 'Access denied: interaction belongs to another counselor',
        },
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate interaction access',
      },
    };
  }
}

/**
 * Validate bulk operation permissions for interactions
 */
async function validateBulkInteractionAccess(
  interactionIds: string[],
  operation: 'read' | 'update' | 'delete',
  context?: TenantContext
): Promise<{ isValid: boolean; error?: SupabaseResponse<null>['error']; invalidIds?: string[] }> {
  try {
    const tenantContext = context || (await getTenantContext());
    if (!tenantContext) {
      return {
        isValid: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    // Fetch all interactions to check ownership
    const { data: interactions, error } = await supabase
      .from('interactions')
      .select('id, counselor_id, tenant_id')
      .in('id', interactionIds);

    if (error) {
      return {
        isValid: false,
        error: handleSupabaseError(error),
      };
    }

    if (!interactions || interactions.length !== interactionIds.length) {
      const foundIds = interactions?.map(i => i.id) || [];
      const missingIds = interactionIds.filter(id => !foundIds.includes(id));
      return {
        isValid: false,
        error: {
          code: 'INTERACTION_NOT_FOUND',
          message: `Some interactions were not found or you do not have permission to access them.`,
        },
        invalidIds: missingIds,
      };
    }

    // Check tenant boundaries and counselor ownership
    const invalidIds: string[] = [];
    for (const interaction of interactions) {
      // Check tenant boundary
      if (interaction.tenant_id !== tenantContext.tenantId) {
        invalidIds.push(interaction.id);
        continue;
      }

      // Check counselor ownership (admins can access all interactions in their tenant)
      if (tenantContext.userRole !== 'ADMIN' && interaction.counselor_id !== tenantContext.userId) {
        invalidIds.push(interaction.id);
      }
    }

    if (invalidIds.length > 0) {
      return {
        isValid: false,
        error: {
          code: 'BULK_ACCESS_VIOLATION',
          message: `Access denied to some interactions in the bulk operation.`,
        },
        invalidIds,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message:
          error instanceof Error ? error.message : 'Failed to validate bulk interaction access',
      },
    };
  }
}

// ============================================================================
// STUDENTS API
// ============================================================================

/**
 * Fetch all students for the current tenant
 */
export async function fetchStudents(): Promise<SupabaseResponse<Student[]>> {
  try {
    // Handle mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Return mock students data
      const mockStudents: Student[] = [
        {
          id: '1',
          studentId: 'STU001',
          firstName: 'John',
          lastName: 'Doe',
          gradeLevel: '9th Grade',
          email: 'john.doe@school.edu',
          phone: '555-0101',
          needsFollowUp: false,
          followUpNotes: null,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          studentId: 'STU002',
          firstName: 'Jane',
          lastName: 'Smith',
          gradeLevel: '10th Grade',
          email: 'jane.smith@school.edu',
          phone: '555-0102',
          needsFollowUp: true,
          followUpNotes: 'Check on academic progress',
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-20'),
        },
        {
          id: '3',
          studentId: 'STU003',
          firstName: 'Mike',
          lastName: 'Johnson',
          gradeLevel: '11th Grade',
          email: 'mike.johnson@school.edu',
          phone: '555-0103',
          needsFollowUp: false,
          followUpNotes: null,
          createdAt: new Date('2024-01-17'),
          updatedAt: new Date('2024-01-17'),
        },
      ];

      return { data: mockStudents, error: null };
    }

    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('last_name', { ascending: true });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const students = (data || []).map(convertStudentFromDb);
    return { data: students, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch students',
      },
    };
  }
}

/**
 * Fetch a single student by ID
 */
export async function fetchStudent(id: string): Promise<SupabaseResponse<Student>> {
  try {
    // Handle mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Return mock student data
      const mockStudents: Student[] = [
        {
          id: '1',
          studentId: 'STU001',
          firstName: 'John',
          lastName: 'Doe',
          gradeLevel: '9th Grade',
          email: 'john.doe@school.edu',
          phone: '555-0101',
          needsFollowUp: false,
          followUpNotes: null,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          studentId: 'STU002',
          firstName: 'Jane',
          lastName: 'Smith',
          gradeLevel: '10th Grade',
          email: 'jane.smith@school.edu',
          phone: '555-0102',
          needsFollowUp: true,
          followUpNotes: 'Check on academic progress',
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-20'),
        },
        {
          id: '3',
          studentId: 'STU003',
          firstName: 'Mike',
          lastName: 'Johnson',
          gradeLevel: '11th Grade',
          email: 'mike.johnson@school.edu',
          phone: '555-0103',
          needsFollowUp: false,
          followUpNotes: null,
          createdAt: new Date('2024-01-17'),
          updatedAt: new Date('2024-01-17'),
        },
      ];

      const student = mockStudents.find(s => s.id === id);
      if (!student) {
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Student not found',
          },
        };
      }

      return { data: student, error: null };
    }

    const { data, error } = await supabase.from('students').select('*').eq('id', id).single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return {
      data: convertStudentFromDb(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch student',
      },
    };
  }
}

/**
 * Create a new student
 */
export async function createStudent(studentData: {
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  email?: string;
  phone?: string;
}): Promise<SupabaseResponse<Student>> {
  try {
    // Handle mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Create a new mock student
      const newStudent: Student = {
        id: Date.now().toString(), // Simple ID generation for mock
        studentId: studentData.studentId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        gradeLevel: studentData.gradeLevel,
        email: studentData.email || null,
        phone: studentData.phone || null,
        needsFollowUp: false,
        followUpNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // In a real app, you'd save to localStorage or a mock database here
      console.log('Mock: Created student', newStudent);

      return { data: newStudent, error: null };
    }

    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    const insertData = {
      tenant_id: context.tenantId,
      student_id: studentData.studentId,
      first_name: studentData.firstName,
      last_name: studentData.lastName,
      grade_level: studentData.gradeLevel,
      email: studentData.email || null,
      phone: studentData.phone || null,
    };

    const { data, error } = await supabase.from('students').insert(insertData).select().single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return {
      data: convertStudentFromDb(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create student',
      },
    };
  }
}

/**
 * Update an existing student
 */
export async function updateStudent(
  id: string,
  updates: Partial<{
    studentId: string;
    firstName: string;
    lastName: string;
    gradeLevel: string;
    email: string;
    phone: string;
    needsFollowUp: boolean;
    followUpNotes: string;
  }>
): Promise<SupabaseResponse<Student>> {
  try {
    // Handle mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Get current mock students
      const mockStudents: Student[] = [
        {
          id: '1',
          studentId: 'STU001',
          firstName: 'John',
          lastName: 'Doe',
          gradeLevel: '9th Grade',
          email: 'john.doe@school.edu',
          phone: '555-0101',
          needsFollowUp: false,
          followUpNotes: null,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          studentId: 'STU002',
          firstName: 'Jane',
          lastName: 'Smith',
          gradeLevel: '10th Grade',
          email: 'jane.smith@school.edu',
          phone: '555-0102',
          needsFollowUp: true,
          followUpNotes: 'Check on academic progress',
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-20'),
        },
        {
          id: '3',
          studentId: 'STU003',
          firstName: 'Mike',
          lastName: 'Johnson',
          gradeLevel: '11th Grade',
          email: 'mike.johnson@school.edu',
          phone: '555-0103',
          needsFollowUp: false,
          followUpNotes: null,
          createdAt: new Date('2024-01-17'),
          updatedAt: new Date('2024-01-17'),
        },
      ];

      const student = mockStudents.find(s => s.id === id);
      if (!student) {
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Student not found',
          },
        };
      }

      // Create updated student
      const updatedStudent: Student = {
        ...student,
        studentId: updates.studentId !== undefined ? updates.studentId : student.studentId,
        firstName: updates.firstName !== undefined ? updates.firstName : student.firstName,
        lastName: updates.lastName !== undefined ? updates.lastName : student.lastName,
        gradeLevel: updates.gradeLevel !== undefined ? updates.gradeLevel : student.gradeLevel,
        email: updates.email !== undefined ? updates.email : student.email,
        phone: updates.phone !== undefined ? updates.phone : student.phone,
        needsFollowUp:
          updates.needsFollowUp !== undefined ? updates.needsFollowUp : student.needsFollowUp,
        followUpNotes:
          updates.followUpNotes !== undefined ? updates.followUpNotes : student.followUpNotes,
        updatedAt: new Date(),
      };

      // In a real app, you'd update localStorage or a mock database here
      console.log('Mock: Updated student', updatedStudent);

      return { data: updatedStudent, error: null };
    }

    const updateData: any = {};

    if (updates.studentId !== undefined) updateData.student_id = updates.studentId;
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.gradeLevel !== undefined) updateData.grade_level = updates.gradeLevel;
    if (updates.email !== undefined) updateData.email = updates.email || null;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.needsFollowUp !== undefined) updateData.needs_follow_up = updates.needsFollowUp;
    if (updates.followUpNotes !== undefined)
      updateData.follow_up_notes = updates.followUpNotes || null;

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return {
      data: convertStudentFromDb(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update student',
      },
    };
  }
}

/**
 * Fetch interactions for a specific student (filtered by current counselor)
 */
export async function fetchStudentInteractions(
  studentId: string
): Promise<SupabaseResponse<Interaction[]>> {
  try {
    // Handle mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Return mock interactions for the specific student
      const allMockInteractions: Interaction[] = [
        {
          id: '1',
          counselorId: '2',
          studentId: '1',
          contactId: null,
          regardingStudentId: null,
          categoryId: '10000000-0000-0000-0000-000000000001', // Academic
          subcategoryId: null,
          customReason: null,
          startTime: new Date('2024-01-15T10:00:00'),
          durationMinutes: 30,
          endTime: new Date('2024-01-15T10:30:00'),
          notes: 'Discussed course selection for next semester',
          needsFollowUp: false,
          followUpDate: undefined,
          followUpNotes: null,
          isFollowUpComplete: false,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          counselorId: '2',
          studentId: '2',
          contactId: null,
          regardingStudentId: null,
          categoryId: '10000000-0000-0000-0000-000000000003', // Social-Emotional
          subcategoryId: null,
          customReason: null,
          startTime: new Date('2024-01-16T14:00:00'),
          durationMinutes: 45,
          endTime: new Date('2024-01-16T14:45:00'),
          notes: 'Student expressed concerns about peer relationships',
          needsFollowUp: true,
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          followUpNotes: 'Schedule follow-up to check progress',
          isFollowUpComplete: false,
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16'),
        },
        {
          id: '3',
          counselorId: '2',
          studentId: '3',
          contactId: null,
          regardingStudentId: null,
          categoryId: '10000000-0000-0000-0000-000000000005', // Crisis Intervention
          subcategoryId: null,
          customReason: null,
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          durationMinutes: 60,
          endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          notes: 'Crisis intervention - student safety concern addressed',
          needsFollowUp: true,
          followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday (overdue)
          followUpNotes: 'Urgent follow-up required',
          isFollowUpComplete: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: '4',
          counselorId: '2',
          studentId: '1',
          contactId: null,
          regardingStudentId: null,
          categoryId: '10000000-0000-0000-0000-000000000001', // Academic
          subcategoryId: null,
          customReason: null,
          startTime: new Date('2024-01-20T11:00:00'),
          durationMinutes: 25,
          endTime: new Date('2024-01-20T11:25:00'),
          notes: 'Follow-up on course selection - student decided on AP Biology',
          needsFollowUp: false,
          followUpDate: undefined,
          followUpNotes: null,
          isFollowUpComplete: false,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20'),
        },
      ];

      // Filter by student and current counselor (mock counselor ID is '2')
      const currentCounselorId = '2'; // In mock mode, assume counselor ID is '2'
      const studentInteractions = allMockInteractions.filter(
        interaction =>
          (interaction.studentId === studentId || interaction.regardingStudentId === studentId) &&
          interaction.counselorId === currentCounselorId
      );

      return { data: studentInteractions, error: null };
    }

    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    // Build query with tenant filtering
    let query = supabase
      .from('interactions')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .or(`student_id.eq.${studentId},regarding_student_id.eq.${studentId}`);

    // For counselors, filter by their own interactions only
    // For admins, show all interactions in the tenant
    if (context.userRole === 'COUNSELOR') {
      query = query.eq('counselor_id', context.userId);
    }

    const { data, error } = await query.order('start_time', { ascending: false });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const interactions = (data || []).map(convertInteractionFromDb);

    // Log student interaction history access
    if (interactions.length > 0) {
      const accessResults = interactions.map(interaction => ({
        id: interaction.id,
        granted: true, // All returned interactions are authorized by RLS
      }));

      await logBulkInteractionAccess(
        interactions.map(i => i.id),
        'read',
        accessResults,
        {
          operation: 'student_interaction_history_access',
          studentId,
          resultCount: interactions.length,
          userRole: context.userRole,
        }
      );
    }

    return { data: interactions, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch student interactions',
      },
    };
  }
}

/**
 * Fetch all reason categories
 */
export async function fetchReasonCategories(): Promise<SupabaseResponse<any[]>> {
  try {
    // Handle mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Return mock categories
      const mockCategories = [
        {
          id: '10000000-0000-0000-0000-000000000001',
          name: 'Academic',
          color: '#3B82F6',
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '10000000-0000-0000-0000-000000000002',
          name: 'Behavioral',
          color: '#EF4444',
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '10000000-0000-0000-0000-000000000003',
          name: 'Social-Emotional',
          color: '#10B981',
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '10000000-0000-0000-0000-000000000004',
          name: 'Career/College',
          color: '#8B5CF6',
          sortOrder: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '10000000-0000-0000-0000-000000000005',
          name: 'Crisis Intervention',
          color: '#F59E0B',
          sortOrder: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      return { data: mockCategories, error: null };
    }

    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    const { data, error } = await supabase
      .from('reason_categories')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('sort_order', { ascending: true });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch reason categories',
      },
    };
  }
}

// ============================================================================
// CONTACTS API
// ============================================================================

/**
 * Fetch all contacts for the current tenant
 */
export async function fetchContacts(): Promise<SupabaseResponse<Contact[]>> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('last_name', { ascending: true });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const contacts = (data || []).map(convertContactFromDb);
    return { data: contacts, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch contacts',
      },
    };
  }
}

/**
 * Fetch a single contact by ID
 */
export async function fetchContact(id: string): Promise<SupabaseResponse<Contact>> {
  try {
    // Validate tenant operation
    const validation = await validateTenantOperation();
    if (!validation.isValid) {
      return {
        data: null,
        error: {
          code: 'TENANT_ERROR',
          message: validation.error || 'Unable to determine tenant context',
        },
      };
    }

    const { context } = validation;

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', context!.tenantId) // Add tenant validation
      .single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return {
      data: convertContactFromDb(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch contact',
      },
    };
  }
}

/**
 * Create a new contact
 */
export async function createContact(contactData: {
  firstName: string;
  lastName: string;
  relationship: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
}): Promise<SupabaseResponse<Contact>> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    const insertData = {
      tenant_id: context.tenantId,
      first_name: contactData.firstName,
      last_name: contactData.lastName,
      relationship: contactData.relationship,
      email: contactData.email || null,
      phone: contactData.phone || null,
      organization: contactData.organization || null,
      notes: contactData.notes || null,
    };

    const { data, error } = await supabase.from('contacts').insert(insertData).select().single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return {
      data: convertContactFromDb(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create contact',
      },
    };
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(
  id: string,
  updates: Partial<{
    firstName: string;
    lastName: string;
    relationship: string;
    email: string;
    phone: string;
    organization: string;
    notes: string;
  }>
): Promise<SupabaseResponse<Contact>> {
  try {
    // Validate tenant operation
    const validation = await validateTenantOperation();
    if (!validation.isValid) {
      return {
        data: null,
        error: {
          code: 'TENANT_ERROR',
          message: validation.error || 'Unable to determine tenant context',
        },
      };
    }

    const { context } = validation;

    // First, check if the contact exists and belongs to the tenant
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', context!.tenantId)
      .single();

    if (fetchError || !existingContact) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Contact not found or access denied',
        },
      };
    }

    const updateData: any = {};

    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.relationship !== undefined) updateData.relationship = updates.relationship;
    if (updates.email !== undefined) updateData.email = updates.email || null;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.organization !== undefined) updateData.organization = updates.organization || null;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', context!.tenantId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return {
      data: convertContactFromDb(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update contact',
      },
    };
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string): Promise<SupabaseResponse<null>> {
  try {
    // Validate tenant operation
    const validation = await validateTenantOperation();
    if (!validation.isValid) {
      return {
        data: null,
        error: {
          code: 'TENANT_ERROR',
          message: validation.error || 'Unable to determine tenant context',
        },
      };
    }

    const { context } = validation;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', context!.tenantId); // Add tenant validation

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    return { data: null, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete contact',
      },
    };
  }
}

/**
 * Fetch interactions for a specific contact (filtered by current counselor)
 */
export async function fetchContactInteractions(
  contactId: string
): Promise<SupabaseResponse<Interaction[]>> {
  try {
    // Handle mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Return mock interactions for the specific contact
      const allMockInteractions: Interaction[] = [
        {
          id: '1',
          counselorId: '2',
          studentId: null,
          contactId: '1',
          regardingStudentId: '1',
          categoryId: '10000000-0000-0000-0000-000000000001', // Academic
          subcategoryId: null,
          customReason: null,
          startTime: new Date('2024-01-15T10:00:00'),
          durationMinutes: 30,
          endTime: new Date('2024-01-15T10:30:00'),
          notes: 'Discussed student academic progress with parent',
          needsFollowUp: false,
          followUpDate: undefined,
          followUpNotes: null,
          isFollowUpComplete: false,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '5',
          counselorId: '2',
          studentId: null,
          contactId: '2',
          regardingStudentId: '2',
          categoryId: '10000000-0000-0000-0000-000000000003', // Social-Emotional
          subcategoryId: null,
          customReason: null,
          startTime: new Date('2024-01-16T14:00:00'),
          durationMinutes: 45,
          endTime: new Date('2024-01-16T14:45:00'),
          notes: 'Parent meeting about student behavior concerns',
          needsFollowUp: true,
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          followUpNotes: 'Schedule follow-up meeting with parent',
          isFollowUpComplete: false,
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16'),
        },
      ];

      // Filter by contact and current counselor (mock counselor ID is '2')
      const currentCounselorId = '2'; // In mock mode, assume counselor ID is '2'
      const contactInteractions = allMockInteractions.filter(
        interaction =>
          interaction.contactId === contactId && interaction.counselorId === currentCounselorId
      );

      return { data: contactInteractions, error: null };
    }

    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    // Build query with tenant filtering
    let query = supabase
      .from('interactions')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .eq('contact_id', contactId);

    // For counselors, filter by their own interactions only
    // For admins, show all interactions in the tenant
    if (context.userRole === 'COUNSELOR') {
      query = query.eq('counselor_id', context.userId);
    }

    const { data, error } = await query.order('start_time', { ascending: false });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const interactions = (data || []).map(convertInteractionFromDb);

    // Log contact interaction history access
    if (interactions.length > 0) {
      const accessResults = interactions.map(interaction => ({
        id: interaction.id,
        granted: true, // All returned interactions are authorized by RLS
      }));

      await logBulkInteractionAccess(
        interactions.map(i => i.id),
        'read',
        accessResults,
        {
          operation: 'contact_interaction_history_access',
          contactId,
          resultCount: interactions.length,
          userRole: context.userRole,
        }
      );
    }

    return { data: interactions, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch contact interactions',
      },
    };
  }
}

// ============================================================================
// INTERACTIONS API
// ============================================================================

/**
 * Fetch all interactions for the current tenant (filtered by current counselor)
 */
export async function fetchInteractions(): Promise<SupabaseResponse<Interaction[]>> {
  try {
    // Handle mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Return mock interactions data with some follow-ups
      const mockInteractions: Interaction[] = [
        {
          id: '1',
          counselorId: '2', // counselor user ID
          studentId: '1',
          contactId: null,
          regardingStudentId: null,
          categoryId: '10000000-0000-0000-0000-000000000001', // Academic
          subcategoryId: null,
          customReason: null,
          startTime: new Date('2024-01-15T10:00:00'),
          durationMinutes: 30,
          endTime: new Date('2024-01-15T10:30:00'),
          notes: 'Discussed course selection for next semester',
          needsFollowUp: false,
          followUpDate: undefined,
          followUpNotes: null,
          isFollowUpComplete: false,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          counselorId: '2',
          studentId: '2',
          contactId: null,
          regardingStudentId: null,
          categoryId: '10000000-0000-0000-0000-000000000003', // Social-Emotional
          subcategoryId: null,
          customReason: null,
          startTime: new Date('2024-01-16T14:00:00'),
          durationMinutes: 45,
          endTime: new Date('2024-01-16T14:45:00'),
          notes: 'Student expressed concerns about peer relationships',
          needsFollowUp: true,
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          followUpNotes: 'Schedule follow-up to check progress',
          isFollowUpComplete: false,
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16'),
        },
        {
          id: '3',
          counselorId: '2',
          studentId: '3',
          contactId: null,
          regardingStudentId: null,
          categoryId: '10000000-0000-0000-0000-000000000005', // Crisis Intervention
          subcategoryId: null,
          customReason: null,
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          durationMinutes: 60,
          endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          notes: 'Crisis intervention - student safety concern addressed',
          needsFollowUp: true,
          followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday (overdue)
          followUpNotes: 'Urgent follow-up required',
          isFollowUpComplete: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ];

      // Filter by current counselor (mock counselor ID is '2')
      const currentCounselorId = '2'; // In mock mode, assume counselor ID is '2'
      const counselorInteractions = mockInteractions.filter(
        interaction => interaction.counselorId === currentCounselorId
      );

      return { data: counselorInteractions, error: null };
    }

    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    // Build query with tenant filtering
    let query = supabase.from('interactions').select('*').eq('tenant_id', context.tenantId);

    // For counselors, filter by their own interactions only
    // For admins, show all interactions in the tenant
    if (context.userRole === 'COUNSELOR') {
      query = query.eq('counselor_id', context.userId);
    }

    const { data, error } = await query.order('start_time', { ascending: false });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const interactions = (data || []).map(convertInteractionFromDb);

    // Log bulk interaction access for audit trail
    if (interactions.length > 0) {
      const accessResults = interactions.map(interaction => ({
        id: interaction.id,
        granted: true, // All returned interactions are authorized by RLS
      }));

      await logBulkInteractionAccess(
        interactions.map(i => i.id),
        'read',
        accessResults,
        {
          operation: 'fetch_interactions',
          resultCount: interactions.length,
          userRole: context.userRole,
        }
      );
    }

    return { data: interactions, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch interactions',
      },
    };
  }
}

/**
 * Fetch a single interaction by ID
 */
export async function fetchInteraction(id: string): Promise<SupabaseResponse<Interaction>> {
  try {
    // Validate access permissions first
    const accessValidation = await validateInteractionAccess(id, 'read');
    if (!accessValidation.isValid) {
      // Log privacy violation attempt with enhanced security logging
      await logPrivacyViolation('interaction', id, 'cross_counselor_access', 'fetch_interaction', {
        denialReason: accessValidation.error?.message,
        errorCode: accessValidation.error?.code,
      });

      return {
        data: null,
        error: accessValidation.error!,
      };
    }

    const { data, error } = await supabase.from('interactions').select('*').eq('id', id).single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    // Log successful interaction access
    await logInteractionAccess(id, 'read', true, undefined, {
      operation: 'fetch_interaction',
    });

    return {
      data: convertInteractionFromDb(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch interaction',
      },
    };
  }
}

/**
 * Create a new interaction
 */
export async function createInteraction(
  formData: InteractionFormData
): Promise<SupabaseResponse<Interaction>> {
  try {
    const context = await getTenantContext();
    if (!context) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User not authenticated',
        },
      };
    }

    // Calculate end time
    const startTime = new Date(formData.startTime);
    const endTime = new Date(startTime.getTime() + formData.durationMinutes * 60000);

    const insertData = {
      tenant_id: context.tenantId,
      counselor_id: context.userId,
      student_id: formData.studentId || null,
      contact_id: formData.contactId || null,
      regarding_student_id: formData.regardingStudentId || null,
      category_id: formData.categoryId,
      subcategory_id: formData.subcategoryId || null,
      custom_reason: formData.customReason || null,
      start_time: formData.startTime,
      duration_minutes: formData.durationMinutes,
      end_time: endTime.toISOString(),
      notes: formData.notes || null,
      needs_follow_up: formData.needsFollowUp,
      follow_up_date: formData.followUpDate || null,
      follow_up_notes: formData.followUpNotes || null,
      is_follow_up_complete: false,
    };

    const { data, error } = await supabase
      .from('interactions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const interaction = convertInteractionFromDb(data);

    // Log successful interaction creation
    await logInteractionAccess(interaction.id, 'create', true, undefined, {
      operation: 'create_interaction',
      studentId: formData.studentId,
      contactId: formData.contactId,
      categoryId: formData.categoryId,
    });

    return {
      data: interaction,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create interaction',
      },
    };
  }
}

/**
 * Update an existing interaction
 */
export async function updateInteraction(
  id: string,
  updates: Partial<InteractionFormData>
): Promise<SupabaseResponse<Interaction>> {
  try {
    // Validate access permissions first
    const accessValidation = await validateInteractionAccess(id, 'update');
    if (!accessValidation.isValid) {
      // Log privacy violation attempt with enhanced security logging
      await logPrivacyViolation('interaction', id, 'cross_counselor_access', 'update_interaction', {
        denialReason: accessValidation.error?.message,
        errorCode: accessValidation.error?.code,
        attemptedUpdates: Object.keys(updates),
      });

      return {
        data: null,
        error: accessValidation.error!,
      };
    }

    const updateData: any = {};

    if (updates.studentId !== undefined) updateData.student_id = updates.studentId || null;
    if (updates.contactId !== undefined) updateData.contact_id = updates.contactId || null;
    if (updates.regardingStudentId !== undefined)
      updateData.regarding_student_id = updates.regardingStudentId || null;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.subcategoryId !== undefined)
      updateData.subcategory_id = updates.subcategoryId || null;
    if (updates.customReason !== undefined) updateData.custom_reason = updates.customReason || null;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.durationMinutes !== undefined) {
      updateData.duration_minutes = updates.durationMinutes;
      // Recalculate end time
      const startTime = new Date(updates.startTime || new Date());
      const endTime = new Date(startTime.getTime() + updates.durationMinutes * 60000);
      updateData.end_time = endTime.toISOString();
    }
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;
    if (updates.needsFollowUp !== undefined) updateData.needs_follow_up = updates.needsFollowUp;
    if (updates.followUpDate !== undefined)
      updateData.follow_up_date = updates.followUpDate || null;
    if (updates.followUpNotes !== undefined)
      updateData.follow_up_notes = updates.followUpNotes || null;

    const { data, error } = await supabase
      .from('interactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const interaction = convertInteractionFromDb(data);

    // Log successful interaction update
    await logInteractionAccess(id, 'update', true, undefined, {
      operation: 'update_interaction',
      updatedFields: Object.keys(updates),
    });

    return {
      data: interaction,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update interaction',
      },
    };
  }
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(id: string): Promise<SupabaseResponse<null>> {
  try {
    // Validate access permissions first
    const accessValidation = await validateInteractionAccess(id, 'delete');
    if (!accessValidation.isValid) {
      // Log privacy violation attempt with enhanced security logging
      await logPrivacyViolation('interaction', id, 'cross_counselor_access', 'delete_interaction', {
        denialReason: accessValidation.error?.message,
        errorCode: accessValidation.error?.code,
      });

      return {
        data: null,
        error: accessValidation.error!,
      };
    }

    const { error } = await supabase.from('interactions').delete().eq('id', id);

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    // Log successful interaction deletion
    await logInteractionAccess(id, 'delete', true, undefined, {
      operation: 'delete_interaction',
    });

    return { data: null, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete interaction',
      },
    };
  }
}

/**
 * Complete a follow-up
 */
export async function completeFollowUp(
  id: string,
  completionNotes?: string
): Promise<SupabaseResponse<Interaction>> {
  try {
    // Validate access permissions first
    const accessValidation = await validateInteractionAccess(id, 'update');
    if (!accessValidation.isValid) {
      // Log privacy violation attempt
      await logPrivacyViolation('interaction', id, 'cross_counselor_access', 'complete_follow_up', {
        denialReason: accessValidation.error?.message,
        errorCode: accessValidation.error?.code,
      });

      return {
        data: null,
        error: accessValidation.error!,
      };
    }

    // Get the current interaction to append completion notes
    const { data: interaction, error: fetchError } = await supabase
      .from('interactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return {
        data: null,
        error: handleSupabaseError(fetchError),
      };
    }

    const updateData: any = {
      is_follow_up_complete: true,
      follow_up_completed_at: new Date().toISOString(),
    };

    // Append completion notes if provided
    if (completionNotes) {
      const existingNotes = interaction.notes || '';
      const completionTimestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const completionNote = `\n\n[Follow-up completed on ${completionTimestamp}]\n${completionNotes}`;
      updateData.notes = existingNotes + completionNote;
    }

    const { data, error } = await supabase
      .from('interactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    // Log successful follow-up completion
    await logInteractionAccess(id, 'update', true, undefined, {
      operation: 'complete_follow_up',
      hasCompletionNotes: !!completionNotes,
    });

    return {
      data: convertInteractionFromDb(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to complete follow-up',
      },
    };
  }
}

// ============================================================================
// BULK OPERATIONS WITH ACCESS CONTROL
// ============================================================================

/**
 * Bulk update interactions with access control validation
 */
export async function bulkUpdateInteractions(
  updates: Array<{ id: string; data: Partial<InteractionFormData> }>
): Promise<SupabaseResponse<Interaction[]>> {
  try {
    const interactionIds = updates.map(u => u.id);

    // Validate access permissions for all interactions
    const accessValidation = await validateBulkInteractionAccess(interactionIds, 'update');
    if (!accessValidation.isValid) {
      // Log bulk privacy violation attempt
      await logPrivacyViolation(
        'interaction',
        'bulk_operation',
        'bulk_access_violation',
        'bulk_update_interactions',
        {
          denialReason: accessValidation.error?.message,
          errorCode: accessValidation.error?.code,
          totalInteractions: interactionIds.length,
          invalidInteractionCount: accessValidation.invalidIds?.length || 0,
        }
      );

      return {
        data: null,
        error: accessValidation.error!,
      };
    }

    const results: Interaction[] = [];
    const errors: string[] = [];

    // Process each update individually to maintain transaction integrity
    for (const update of updates) {
      const result = await updateInteraction(update.id, update.data);
      if (result.error) {
        errors.push(`Failed to update interaction ${update.id}: ${result.error.message}`);
      } else if (result.data) {
        results.push(result.data);
      }
    }

    if (errors.length > 0) {
      return {
        data: null,
        error: {
          code: 'BULK_UPDATE_ERROR',
          message: `Bulk update failed: ${errors.join('; ')}`,
        },
      };
    }

    // Log successful bulk update
    await logBulkInteractionAccess(
      interactionIds,
      'update',
      results.map(r => ({ id: r.id, granted: true })),
      {
        operation: 'bulk_update_interactions',
        successCount: results.length,
      }
    );

    return { data: results, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to bulk update interactions',
      },
    };
  }
}

/**
 * Bulk delete interactions with access control validation
 */
export async function bulkDeleteInteractions(
  interactionIds: string[]
): Promise<SupabaseResponse<null>> {
  try {
    // Validate access permissions for all interactions
    const accessValidation = await validateBulkInteractionAccess(interactionIds, 'delete');
    if (!accessValidation.isValid) {
      // Log bulk privacy violation attempt
      await logPrivacyViolation(
        'interaction',
        'bulk_operation',
        'bulk_access_violation',
        'bulk_delete_interactions',
        {
          denialReason: accessValidation.error?.message,
          errorCode: accessValidation.error?.code,
          totalInteractions: interactionIds.length,
          invalidInteractionCount: accessValidation.invalidIds?.length || 0,
        }
      );

      return {
        data: null,
        error: accessValidation.error!,
      };
    }

    const errors: string[] = [];

    // Process each deletion individually to maintain transaction integrity
    for (const id of interactionIds) {
      const result = await deleteInteraction(id);
      if (result.error) {
        errors.push(`Failed to delete interaction ${id}: ${result.error.message}`);
      }
    }

    if (errors.length > 0) {
      return {
        data: null,
        error: {
          code: 'BULK_DELETE_ERROR',
          message: `Bulk delete failed: ${errors.join('; ')}`,
        },
      };
    }

    // Log successful bulk deletion
    await logBulkInteractionAccess(
      interactionIds,
      'delete',
      interactionIds.map(id => ({ id, granted: true })),
      {
        operation: 'bulk_delete_interactions',
        successCount: interactionIds.length,
      }
    );

    return { data: null, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to bulk delete interactions',
      },
    };
  }
}

/**
 * Bulk complete follow-ups with access control validation
 */
export async function bulkCompleteFollowUps(
  completions: Array<{ id: string; completionNotes?: string }>
): Promise<SupabaseResponse<Interaction[]>> {
  try {
    const interactionIds = completions.map(c => c.id);

    // Validate access permissions for all interactions
    const accessValidation = await validateBulkInteractionAccess(interactionIds, 'update');
    if (!accessValidation.isValid) {
      // Log bulk privacy violation attempt
      await logPrivacyViolation(
        'interaction',
        'bulk_operation',
        'bulk_access_violation',
        'bulk_complete_follow_ups',
        {
          denialReason: accessValidation.error?.message,
          errorCode: accessValidation.error?.code,
          totalInteractions: interactionIds.length,
          invalidInteractionCount: accessValidation.invalidIds?.length || 0,
        }
      );

      return {
        data: null,
        error: accessValidation.error!,
      };
    }

    const results: Interaction[] = [];
    const errors: string[] = [];

    // Process each completion individually to maintain transaction integrity
    for (const completion of completions) {
      const result = await completeFollowUp(completion.id, completion.completionNotes);
      if (result.error) {
        errors.push(`Failed to complete follow-up ${completion.id}: ${result.error.message}`);
      } else if (result.data) {
        results.push(result.data);
      }
    }

    if (errors.length > 0) {
      return {
        data: null,
        error: {
          code: 'BULK_COMPLETION_ERROR',
          message: `Bulk completion failed: ${errors.join('; ')}`,
        },
      };
    }

    // Log successful bulk completion
    await logBulkInteractionAccess(
      interactionIds,
      'update',
      results.map(r => ({ id: r.id, granted: true })),
      {
        operation: 'bulk_complete_follow_ups',
        successCount: results.length,
      }
    );

    return { data: results, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to bulk complete follow-ups',
      },
    };
  }
}

// ============================================================================
// DATA CONVERSION HELPERS
// ============================================================================

function convertStudentFromDb(dbStudent: StudentDbResponse): Student {
  return {
    id: dbStudent.id,
    studentId: dbStudent.student_id,
    firstName: dbStudent.first_name,
    lastName: dbStudent.last_name,
    gradeLevel: dbStudent.grade_level,
    email: dbStudent.email,
    phone: dbStudent.phone,
    needsFollowUp: dbStudent.needs_follow_up,
    followUpNotes: dbStudent.follow_up_notes,
    createdAt: new Date(dbStudent.created_at),
    updatedAt: new Date(dbStudent.updated_at),
  };
}

function convertContactFromDb(dbContact: ContactDbResponse): Contact {
  return {
    id: dbContact.id,
    firstName: dbContact.first_name,
    lastName: dbContact.last_name,
    relationship: dbContact.relationship,
    email: dbContact.email,
    phone: dbContact.phone,
    organization: dbContact.organization,
    notes: dbContact.notes,
    createdAt: new Date(dbContact.created_at),
    updatedAt: new Date(dbContact.updated_at),
  };
}

function convertInteractionFromDb(dbInteraction: InteractionDbResponse): Interaction {
  return {
    id: dbInteraction.id,
    counselorId: dbInteraction.counselor_id,
    studentId: dbInteraction.student_id,
    contactId: dbInteraction.contact_id,
    regardingStudentId: dbInteraction.regarding_student_id,
    categoryId: dbInteraction.category_id,
    subcategoryId: dbInteraction.subcategory_id,
    customReason: dbInteraction.custom_reason,
    startTime: new Date(dbInteraction.start_time),
    durationMinutes: dbInteraction.duration_minutes,
    endTime: new Date(dbInteraction.end_time),
    notes: dbInteraction.notes,
    needsFollowUp: dbInteraction.needs_follow_up,
    followUpDate: dbInteraction.follow_up_date ? new Date(dbInteraction.follow_up_date) : undefined,
    followUpNotes: dbInteraction.follow_up_notes,
    isFollowUpComplete: dbInteraction.is_follow_up_complete,
    createdAt: new Date(dbInteraction.created_at),
    updatedAt: new Date(dbInteraction.updated_at),
  };
}
