import { useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useInteractions } from '@/hooks/useInteractions';
import type { Student } from '@/types/student';
import { StudentList } from '@/components/students/StudentList';
import { StudentSearch } from '@/components/students/StudentSearch';
import { StudentFormModal } from '@/components/students/StudentFormModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition, TableSkeleton } from '@/components/common';
import { Plus } from 'lucide-react';

export function Students() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Use React Query hooks instead of local state
  const { data: students = [], isLoading: studentsLoading, error: studentsError } = useStudents();
  const { interactions = [], isLoading: interactionsLoading } = useInteractions();

  const loading = studentsLoading || interactionsLoading;
  const error = studentsError ? (studentsError as Error).message : null;

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Students</h1>
          <Card>
            <CardContent className="pt-6">
              <TableSkeleton rows={8} />
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Students</h1>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Students</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Manage student profiles and interaction history.
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Search Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Search</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentSearch students={students} />
          </CardContent>
        </Card>

        {/* Student List Card */}
        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentList
              students={students}
              interactions={interactions}
              onEditStudent={student => setEditingStudent(student)}
            />
          </CardContent>
        </Card>

        {/* Add Student Modal */}
        <StudentFormModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

        {/* Edit Student Modal */}
        <StudentFormModal
          open={!!editingStudent}
          onOpenChange={open => !open && setEditingStudent(null)}
          student={editingStudent}
        />
      </div>
    </PageTransition>
  );
}
