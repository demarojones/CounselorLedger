import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStudent } from '@/services/api';
import { supabase } from '@/services/supabase';
import type { Student } from '@/types/student';
import type { Interaction, InteractionDbResponse } from '@/types/interaction';
import type { ReasonCategory } from '@/types/reason';
import { StudentProfile } from '@/components/students/StudentProfile';
import { InteractionHistory } from '@/components/students/InteractionHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [categories, setCategories] = useState<ReasonCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchStudentData(studentId);
    }
  }, [studentId]);

  const fetchStudentData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student using the API
      const studentResponse = await fetchStudent(id);

      if (studentResponse.error) {
        throw new Error(studentResponse.error.message);
      }

      if (!studentResponse.data) {
        throw new Error('Student not found');
      }

      // Fetch interactions for this student (both direct and regarding)
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .or(`student_id.eq.${id},regarding_student_id.eq.${id}`)
        .order('start_time', { ascending: false });

      if (interactionsError) throw interactionsError;

      // Fetch reason categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('reason_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      const transformedStudent = studentResponse.data;

      console.log('Fetched student:', transformedStudent);

      // Transform interactions data
      const transformedInteractions: Interaction[] = (
        interactionsData as InteractionDbResponse[]
      ).map(interaction => ({
        id: interaction.id,
        counselorId: interaction.counselor_id,
        studentId: interaction.student_id,
        contactId: interaction.contact_id,
        regardingStudentId: interaction.regarding_student_id,
        categoryId: interaction.category_id,
        subcategoryId: interaction.subcategory_id,
        customReason: interaction.custom_reason,
        startTime: new Date(interaction.start_time),
        durationMinutes: interaction.duration_minutes,
        endTime: new Date(interaction.end_time),
        notes: interaction.notes,
        needsFollowUp: interaction.needs_follow_up,
        followUpDate: interaction.follow_up_date ? new Date(interaction.follow_up_date) : undefined,
        followUpNotes: interaction.follow_up_notes,
        isFollowUpComplete: interaction.is_follow_up_complete,
        createdAt: new Date(interaction.created_at),
        updatedAt: new Date(interaction.updated_at),
      }));

      // Calculate stats
      const interactionCount = transformedInteractions.length;
      const totalTimeSpent = transformedInteractions.reduce(
        (sum, interaction) => sum + interaction.durationMinutes,
        0
      );

      // Transform categories data
      const transformedCategories: ReasonCategory[] = categoriesData.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        sortOrder: cat.sort_order,
        createdAt: new Date(cat.created_at),
        updatedAt: new Date(cat.updated_at),
      }));

      setStudent({
        ...transformedStudent,
        interactionCount,
        totalTimeSpent,
      });
      setInteractions(transformedInteractions);
      setCategories(transformedCategories);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInteraction = () => {
    // Navigate to interactions page with student pre-populated
    navigate(`/interactions?studentId=${studentId}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/students')} className="mb-4">
          ← Back to Students
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading student...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/students')} className="mb-4">
          ← Back to Students
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'Student not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInteractionClick = (interactionId: string) => {
    // Navigate to interaction detail (to be implemented)
    navigate(`/interactions/${interactionId}`);
  };

  return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => navigate('/students')} className="mb-6">
        ← Back to Students
      </Button>
      <StudentProfile student={student} onAddInteraction={handleAddInteraction} />

      {/* Interaction History */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Interaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <InteractionHistory
              interactions={interactions}
              categories={categories}
              onInteractionClick={handleInteractionClick}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
