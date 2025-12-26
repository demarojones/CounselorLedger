import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import type { Student, StudentDbResponse } from '@/types/student';
import type { Interaction, InteractionDbResponse } from '@/types/interaction';
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

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('last_name', { ascending: true });

      if (studentsError) throw studentsError;

      // Fetch interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*');

      if (interactionsError) throw interactionsError;

      // Transform students data
      const transformedStudents: Student[] = (studentsData as StudentDbResponse[]).map(
        (student) => ({
          id: student.id,
          studentId: student.student_id,
          firstName: student.first_name,
          lastName: student.last_name,
          gradeLevel: student.grade_level,
          email: student.email,
          phone: student.phone,
          needsFollowUp: student.needs_follow_up,
          followUpNotes: student.follow_up_notes,
          createdAt: new Date(student.created_at),
          updatedAt: new Date(student.updated_at),
        })
      );

      // Transform interactions data
      const transformedInteractions: Interaction[] = (
        interactionsData as InteractionDbResponse[]
      ).map((interaction) => ({
        id: interaction.id,
        counselorId: interaction.counselor_id,
        studentId: interaction.student_id,
        contactId: interaction.contact_id,
        categoryId: interaction.category_id,
        subcategoryId: interaction.subcategory_id,
        customReason: interaction.custom_reason,
        startTime: new Date(interaction.start_time),
        durationMinutes: interaction.duration_minutes,
        endTime: new Date(interaction.end_time),
        notes: interaction.notes,
        needsFollowUp: interaction.needs_follow_up,
        followUpDate: interaction.follow_up_date
          ? new Date(interaction.follow_up_date)
          : undefined,
        followUpNotes: interaction.follow_up_notes,
        isFollowUpComplete: interaction.is_follow_up_complete,
        createdAt: new Date(interaction.created_at),
        updatedAt: new Date(interaction.updated_at),
      }));

      setStudents(transformedStudents);
      setInteractions(transformedInteractions);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load students. Please try again.');
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
