import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { toast } from '@/utils/toast';
import { handleApiError } from '@/utils/errorHandling';
import { queryKeys } from '@/lib/queryClient';
import type { Student, StudentDbResponse } from '@/types/student';

// Helper function to convert snake_case DB response to camelCase
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

// Fetch all students
async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('last_name', { ascending: true });

  if (error) throw error;
  return (data || []).map(convertStudentFromDb);
}

// Fetch single student by ID
async function fetchStudent(id: string): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return convertStudentFromDb(data);
}

// Create student
interface CreateStudentData {
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  email?: string;
  phone?: string;
}

async function createStudent(data: CreateStudentData): Promise<Student> {
  const insertData = {
    student_id: data.studentId,
    first_name: data.firstName,
    last_name: data.lastName,
    grade_level: data.gradeLevel,
    email: data.email || null,
    phone: data.phone || null,
  };

  const { data: newStudent, error } = await supabase
    .from('students')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return convertStudentFromDb(newStudent);
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
  
  const updateData: any = {};
  if (updateFields.studentId !== undefined) updateData.student_id = updateFields.studentId;
  if (updateFields.firstName !== undefined) updateData.first_name = updateFields.firstName;
  if (updateFields.lastName !== undefined) updateData.last_name = updateFields.lastName;
  if (updateFields.gradeLevel !== undefined) updateData.grade_level = updateFields.gradeLevel;
  if (updateFields.email !== undefined) updateData.email = updateFields.email || null;
  if (updateFields.phone !== undefined) updateData.phone = updateFields.phone || null;
  if (updateFields.needsFollowUp !== undefined) updateData.needs_follow_up = updateFields.needsFollowUp;
  if (updateFields.followUpNotes !== undefined) updateData.follow_up_notes = updateFields.followUpNotes || null;

  const { data: updatedStudent, error } = await supabase
    .from('students')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return convertStudentFromDb(updatedStudent);
}

// Delete student
async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw error;
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
    queryFn: fetchStudents,
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
    queryFn: () => fetchStudent(id),
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
    onSuccess: (newStudent) => {
      // Invalidate students list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      
      // Optimistically add to cache
      queryClient.setQueryData(queryKeys.student(newStudent.id), newStudent);
      
      toast.success('Student created successfully');
    },
    onError: (error) => {
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
    onMutate: async (data) => {
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
    onSuccess: (updatedStudent) => {
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
    mutationFn: deleteStudent,
    onMutate: async (id) => {
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
