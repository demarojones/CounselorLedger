/**
 * Supabase Helper Usage Examples
 * 
 * This file demonstrates how to use the Supabase helper functions
 * for common operations in the School Counselor Ledger application.
 * 
 * NOTE: This file is for reference only and should not be imported in production code.
 */

import {
  selectFromTable,
  selectSingleFromTable,
  insertIntoTable,
  updateInTable,
  deleteFromTable,
  subscribeToTable,
  unsubscribeFromChannel,
  getTenantContext,
  isCurrentUserAdmin,
  getUserFriendlyErrorMessage,
  isSupabaseConfigured,
  isMockDataMode,
} from './supabaseHelpers';
import type { Student } from '../types/student';
import type { Interaction } from '../types/interaction';
import type { Contact } from '../types/contact';

// ============================================================================
// EXAMPLE 1: Fetching Data with Error Handling
// ============================================================================

export async function exampleFetchStudents() {
  // Fetch all students with ordering
  const { data: students, error } = await selectFromTable<Student>('students', '*', {
    orderBy: { column: 'last_name', ascending: true },
    limit: 50,
  });

  if (error) {
    console.error('Error fetching students:', getUserFriendlyErrorMessage(error));
    return [];
  }

  return students || [];
}

// ============================================================================
// EXAMPLE 2: Fetching a Single Record
// ============================================================================

export async function exampleFetchStudent(studentId: string) {
  const { data: student, error } = await selectSingleFromTable<Student>(
    'students',
    studentId,
    '*, interactions(count)'
  );

  if (error) {
    console.error('Error fetching student:', getUserFriendlyErrorMessage(error));
    return null;
  }

  return student;
}

// ============================================================================
// EXAMPLE 3: Creating a New Record
// ============================================================================

export async function exampleCreateStudent(studentData: Partial<Student>) {
  // Get tenant context to ensure proper tenant assignment
  const context = await getTenantContext();

  if (!context) {
    console.error('No tenant context available');
    return null;
  }

  const { data: newStudent, error } = await insertIntoTable<Student>('students', {
    ...studentData,
    tenantId: context.tenantId,
  } as Partial<Student>);

  if (error) {
    console.error('Error creating student:', getUserFriendlyErrorMessage(error));
    return null;
  }

  console.log('Student created successfully:', newStudent);
  return newStudent;
}

// ============================================================================
// EXAMPLE 4: Updating a Record
// ============================================================================

export async function exampleUpdateStudent(studentId: string, updates: Partial<Student>) {
  const { data: updatedStudent, error } = await updateInTable<Student>(
    'students',
    studentId,
    updates
  );

  if (error) {
    console.error('Error updating student:', getUserFriendlyErrorMessage(error));
    return null;
  }

  console.log('Student updated successfully:', updatedStudent);
  return updatedStudent;
}

// ============================================================================
// EXAMPLE 5: Deleting a Record
// ============================================================================

export async function exampleDeleteStudent(studentId: string) {
  // Check if user is admin before allowing delete
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    console.error('Only admins can delete students');
    return false;
  }

  const { error } = await deleteFromTable('students', studentId);

  if (error) {
    console.error('Error deleting student:', getUserFriendlyErrorMessage(error));
    return false;
  }

  console.log('Student deleted successfully');
  return true;
}

// ============================================================================
// EXAMPLE 6: Real-time Subscriptions
// ============================================================================

export function exampleSubscribeToInteractions() {
  // Subscribe to new interactions
  const channel = subscribeToTable<Interaction>({
    table: 'interactions',
    event: 'INSERT',
    callback: (payload) => {
      console.log('New interaction created:', payload.new);
      // Update UI with new interaction
      // e.g., refetch queries, show notification, etc.
    },
  });

  // Return cleanup function
  return () => {
    unsubscribeFromChannel(channel);
  };
}

export function exampleSubscribeToStudentUpdates(studentId: string) {
  // Subscribe to updates for a specific student
  const channel = subscribeToTable<Student>({
    table: 'students',
    event: 'UPDATE',
    filter: `id=eq.${studentId}`,
    callback: (payload) => {
      console.log('Student updated:', payload.new);
      // Update UI with updated student data
    },
  });

  return () => {
    unsubscribeFromChannel(channel);
  };
}

// ============================================================================
// EXAMPLE 7: Complex Queries with Joins
// ============================================================================

export async function exampleFetchInteractionsWithRelations() {
  const { data: interactions, error } = await selectFromTable<Interaction>(
    'interactions',
    `
      *,
      student:students(*),
      contact:contacts(*),
      category:reason_categories(*),
      subcategory:reason_subcategories(*),
      counselor:users(*)
    `,
    {
      orderBy: { column: 'start_time', ascending: false },
      limit: 20,
    }
  );

  if (error) {
    console.error('Error fetching interactions:', getUserFriendlyErrorMessage(error));
    return [];
  }

  return interactions || [];
}

// ============================================================================
// EXAMPLE 8: Filtering with Tenant Context
// ============================================================================

export async function exampleFetchUserContacts() {
  const context = await getTenantContext();

  if (!context) {
    console.error('No tenant context available');
    return [];
  }

  // RLS policies automatically filter by tenant, but we can add additional filters
  const { data: contacts, error } = await selectFromTable<Contact>(
    'contacts',
    '*',
    {
      orderBy: { column: 'last_name', ascending: true },
    }
  );

  if (error) {
    console.error('Error fetching contacts:', getUserFriendlyErrorMessage(error));
    return [];
  }

  return contacts || [];
}

// ============================================================================
// EXAMPLE 9: Checking Configuration
// ============================================================================

export function exampleCheckConfiguration() {
  if (isMockDataMode()) {
    console.log('Running in mock data mode');
    return 'mock';
  }

  if (!isSupabaseConfigured()) {
    console.error('Supabase is not properly configured');
    return 'unconfigured';
  }

  console.log('Supabase is configured and ready');
  return 'configured';
}

// ============================================================================
// EXAMPLE 10: Using in React Components with React Query
// ============================================================================

/*
// In a React component:

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { selectFromTable, insertIntoTable } from '../services/supabaseHelpers';

function StudentsComponent() {
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await selectFromTable<Student>('students', '*', {
        orderBy: { column: 'last_name', ascending: true },
      });
      if (error) throw new Error(getUserFriendlyErrorMessage(error));
      return data || [];
    },
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (newStudent: Partial<Student>) => {
      const context = await getTenantContext();
      const { data, error } = await insertIntoTable<Student>('students', {
        ...newStudent,
        tenant_id: context?.tenantId,
      });
      if (error) throw new Error(getUserFriendlyErrorMessage(error));
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch students
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = subscribeToTable<Student>({
      table: 'students',
      event: '*',
      callback: () => {
        // Refetch students when changes occur
        queryClient.invalidateQueries({ queryKey: ['students'] });
      },
    });

    return () => {
      unsubscribeFromChannel(channel);
    };
  }, [queryClient]);

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {students?.map(student => (
        <div key={student.id}>{student.firstName} {student.lastName}</div>
      ))}
    </div>
  );
}
*/

// ============================================================================
// EXAMPLE 11: Error Handling Patterns
// ============================================================================

export async function exampleErrorHandling() {
  const { data, error } = await selectFromTable<Student>('students');

  if (error) {
    // Get user-friendly message
    const message = getUserFriendlyErrorMessage(error);

    // Check specific error types
    if (error.code === '42501') {
      console.error('Permission denied:', message);
      // Redirect to login or show permission error
    } else if (error.code === '23505') {
      console.error('Duplicate record:', message);
      // Show validation error to user
    } else {
      console.error('General error:', message);
      // Show generic error message
    }

    return null;
  }

  return data;
}

// ============================================================================
// EXAMPLE 12: Batch Operations
// ============================================================================

export async function exampleBatchCreateStudents(students: Partial<Student>[]) {
  const context = await getTenantContext();

  if (!context) {
    console.error('No tenant context available');
    return [];
  }

  // Add tenant_id to all students
  const studentsWithTenant = students.map(student => ({
    ...student,
    tenant_id: context.tenantId,
  }));

  // Use Supabase directly for batch operations
  const { supabase } = await import('./supabase');
  const { data, error } = await supabase
    .from('students')
    .insert(studentsWithTenant)
    .select();

  if (error) {
    console.error('Error batch creating students:', getUserFriendlyErrorMessage(error));
    return [];
  }

  return data || [];
}
