import { useEffect, useState } from 'react';
import { fetchStudents, fetchInteractions } from '@/services/api';
import type { Student } from '@/types/student';
import type { Interaction } from '@/types/interaction';
import { StudentList } from '@/components/students/StudentList';
import { StudentSearch } from '@/components/students/StudentSearch';
import { StudentFormModal } from '@/components/students/StudentFormModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition, TableSkeleton } from '@/components/common';
import { Plus } from 'lucide-react';

export function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch students and interactions using the API
      const [studentsResponse, interactionsResponse] = await Promise.all([
        fetchStudents(),
        fetchInteractions(),
      ]);

      if (studentsResponse.error) {
        throw new Error(studentsResponse.error.message);
      }

      if (interactionsResponse.error) {
        throw new Error(interactionsResponse.error.message);
      }

      setStudents(studentsResponse.data || []);
      setInteractions(interactionsResponse.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            onEditStudent={(student) => setEditingStudent(student)}
          />
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      <StudentFormModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {/* Edit Student Modal */}
      <StudentFormModal
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
        student={editingStudent}
      />
    </div>
    </PageTransition>
  );
}
