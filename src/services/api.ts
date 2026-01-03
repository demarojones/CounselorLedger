/**
 * API Service Layer
 * 
 * High-level API for managing contacts, students, and interactions.
 * Handles data transformation, validation, and Supabase operations.
 */

import { supabase } from './supabase';
import { getTenantContext, handleSupabaseError, type SupabaseResponse } from './supabaseHelpers';
import type { Student, StudentDbResponse } from '@/types/student';
import type { Contact, ContactDbResponse } from '@/types/contact';
import type { Interaction, InteractionFormData, InteractionDbResponse } from '@/types/interaction';

// ============================================================================
// STUDENTS API
// ============================================================================

/**
 * Fetch all students for the current tenant
 */
export async function fetchStudents(): Promise<SupabaseResponse<Student[]>> {
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
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
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

    const { data, error } = await supabase
      .from('students')
      .insert(insertData)
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
    const updateData: any = {};

    if (updates.studentId !== undefined) updateData.student_id = updates.studentId;
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.gradeLevel !== undefined) updateData.grade_level = updates.gradeLevel;
    if (updates.email !== undefined) updateData.email = updates.email || null;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.needsFollowUp !== undefined) updateData.needs_follow_up = updates.needsFollowUp;
    if (updates.followUpNotes !== undefined) updateData.follow_up_notes = updates.followUpNotes || null;

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
 * Delete a student
 */
export async function deleteStudent(id: string): Promise<SupabaseResponse<null>> {
  try {
    const { error } = await supabase.from('students').delete().eq('id', id);

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
        message: error instanceof Error ? error.message : 'Failed to delete student',
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
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
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

    const { data, error } = await supabase
      .from('contacts')
      .insert(insertData)
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
    const { error } = await supabase.from('contacts').delete().eq('id', id);

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

// ============================================================================
// INTERACTIONS API
// ============================================================================

/**
 * Fetch all interactions for the current tenant
 */
export async function fetchInteractions(): Promise<SupabaseResponse<Interaction[]>> {
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
      .from('interactions')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('start_time', { ascending: false });

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const interactions = (data || []).map(convertInteractionFromDb);
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
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

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
export async function createInteraction(formData: InteractionFormData): Promise<SupabaseResponse<Interaction>> {
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

    return {
      data: convertInteractionFromDb(data),
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
    const updateData: any = {};

    if (updates.studentId !== undefined) updateData.student_id = updates.studentId || null;
    if (updates.contactId !== undefined) updateData.contact_id = updates.contactId || null;
    if (updates.regardingStudentId !== undefined) updateData.regarding_student_id = updates.regardingStudentId || null;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.subcategoryId !== undefined) updateData.subcategory_id = updates.subcategoryId || null;
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
    if (updates.followUpDate !== undefined) updateData.follow_up_date = updates.followUpDate || null;
    if (updates.followUpNotes !== undefined) updateData.follow_up_notes = updates.followUpNotes || null;

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

    return {
      data: convertInteractionFromDb(data),
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
    const { error } = await supabase.from('interactions').delete().eq('id', id);

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
