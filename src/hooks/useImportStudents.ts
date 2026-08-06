import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStudentsBatch } from '@/services/api';
import { toast } from '@/utils/toast';
import { queryKeys } from '@/lib/queryClient';
import type { Student } from '@/types/student';

interface ImportStudentData {
  studentId?: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  email?: string;
  phone?: string;
}

async function importStudents(students: ImportStudentData[]): Promise<Student[]> {
  const response = await createStudentsBatch(students);
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error('Failed to import students');
  }
  return response.data;
}

/**
 * Hook to batch import students from CSV/Excel
 */
export function useImportStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importStudents,
    onSuccess: newStudents => {
      // Invalidate students cache to refetch the full list
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      toast.success(`Successfully imported ${newStudents.length} student${newStudents.length === 1 ? '' : 's'}`);
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });
}
