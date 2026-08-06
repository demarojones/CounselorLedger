import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStudents,
  fetchStudent,
  createStudent as apiCreateStudent,
  updateStudent as apiUpdateStudent,
} from '@/services/api';
import { toast } from '@/utils/toast';
import { handleApiError } from '@/utils/errorHandling';
import { queryKeys } from '@/lib/queryClient';
import type { Student } from '@/types/student';

// Create student
interface CreateStudentData {
  studentId?: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  email?: string;
  phone?: string;
}

async function createStudent(data: CreateStudentData): Promise<Student> {
  const response = await apiCreateStudent(data);
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error('Failed to create student');
  }
  return response.data;
}

// Update student
interface UpdateStudentData {
  id: string;
  studentId?: string;
  firstName?: string;
  lastName?: string;
  gradeLevel?: string;
  email?: string;
  phone?: string;
  needsFollowUp?: boolean;
  followUpNotes?: string;
}

async function updateStudent(data: UpdateStudentData): Promise<Student> {
  const { id, ...updateFields } = data;
  const response = await apiUpdateStudent(id, updateFields);
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error('Failed to update student');
  }
  return response.data;
}

// Wrapper functions for the API
async function fetchStudentsWrapper(): Promise<Student[]> {
  const response = await fetchStudents();
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data || [];
}

async function fetchStudentWrapper(id: string): Promise<Student> {
  const response = await fetchStudent(id);
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error('Student not found');
  }
  return response.data;
}

/**
 * Hook to fetch all students for the current tenant
 * @returns {UseQueryResult<Student[]>} React Query result with students array
 * @example
 * const { data: students, isLoading, error } = useStudents();
 */
export function useStudents() {
  return useQuery({
    queryKey: queryKeys.students,
    queryFn: fetchStudentsWrapper,
  });
}

/**
 * Hook to fetch a single student by ID
 * @param {string} id - The student's unique identifier
 * @returns {UseQueryResult<Student>} React Query result with student data
 * @example
 * const { data: student, isLoading } = useStudent(studentId);
 */
export function useStudent(id: string) {
  return useQuery({
    queryKey: queryKeys.student(id),
    queryFn: () => fetchStudentWrapper(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new student
 * @returns {UseMutationResult} React Query mutation with mutate function
 * @example
 * const createStudent = useCreateStudent();
 * createStudent.mutate({
 *   studentId: 'S12345',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   gradeLevel: '10'
 * });
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onMutate: async newStudentData => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.students });

      // Snapshot previous value
      const previousStudents = queryClient.getQueryData<Student[]>(queryKeys.students);

      // Optimistically add new student to the list
      if (previousStudents) {
        const optimisticStudent: Student = {
          id: `temp-${Date.now()}`, // Temporary ID
          studentId: newStudentData.studentId || 'Generating...',
          firstName: newStudentData.firstName,
          lastName: newStudentData.lastName,
          gradeLevel: newStudentData.gradeLevel,
          email: newStudentData.email,
          phone: newStudentData.phone,
          needsFollowUp: false,
          followUpNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData<Student[]>(queryKeys.students, [
          ...previousStudents,
          optimisticStudent,
        ]);
      }

      return { previousStudents };
    },
    onSuccess: (newStudent, _, context) => {
      // Replace optimistic student with real data from server
      const previousStudents = context?.previousStudents;
      
      if (previousStudents) {
        // Remove the optimistic entry and add the real one
        queryClient.setQueryData<Student[]>(queryKeys.students, old => {
          if (!old) return [newStudent];
          // Filter out any temp entries and add the real student
          return [...old.filter(s => !s.id.startsWith('temp-')), newStudent];
        });
      } else {
        // Fallback: just invalidate to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.students });
      }

      // Add to individual student cache
      queryClient.setQueryData(queryKeys.student(newStudent.id), newStudent);

      toast.success('Student created successfully');
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousStudents) {
        queryClient.setQueryData(queryKeys.students, context.previousStudents);
      }

      const apiError = handleApiError(error, { customMessage: 'Failed to create student' });
      toast.error(apiError.message);
    },
  });
}

/**
 * Hook to update an existing student with optimistic updates
 * @returns {UseMutationResult} React Query mutation with mutate function
 * @example
 * const updateStudent = useUpdateStudent();
 * updateStudent.mutate({
 *   id: 'student-uuid',
 *   gradeLevel: '11',
 *   needsFollowUp: true
 * });
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStudent,
    onMutate: async data => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.student(data.id) });

      // Snapshot previous value
      const previousStudent = queryClient.getQueryData(queryKeys.student(data.id));

      // Optimistically update
      if (previousStudent) {
        queryClient.setQueryData(queryKeys.student(data.id), {
          ...previousStudent,
          ...data,
        });
      }

      return { previousStudent };
    },
    onSuccess: updatedStudent => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.student(updatedStudent.id), updatedStudent);

      // Invalidate students list
      queryClient.invalidateQueries({ queryKey: queryKeys.students });

      toast.success('Student updated successfully');
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousStudent) {
        queryClient.setQueryData(queryKeys.student(variables.id), context.previousStudent);
      }

      const apiError = handleApiError(error, { customMessage: 'Failed to update student' });
      toast.error(apiError.message);
    },
  });
}

/**
 * Hook to delete a student with optimistic updates
 * @returns {UseMutationResult} React Query mutation with mutate function
 * @example
 * const deleteStudent = useDeleteStudent();
 * deleteStudent.mutate('student-uuid');
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_id: string) => {
      // For now, just throw an error since delete is not implemented in mock mode
      throw new Error('Delete student functionality not implemented in mock mode');
    },
    onMutate: async id => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.students });

      // Snapshot previous value
      const previousStudents = queryClient.getQueryData(queryKeys.students);

      // Optimistically remove from list
      queryClient.setQueryData(queryKeys.students, (old: Student[] | undefined) =>
        old ? old.filter(s => s.id !== id) : []
      );

      return { previousStudents };
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.student(id) });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.interactionsByStudent(id) });

      toast.success('Student deleted successfully');
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousStudents) {
        queryClient.setQueryData(queryKeys.students, context.previousStudents);
      }

      const apiError = handleApiError(error, { customMessage: 'Failed to delete student' });
      toast.error(apiError.message);
    },
  });
}
