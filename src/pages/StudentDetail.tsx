import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStudent, fetchStudentInteractions, fetchReasonCategories } from '@/services/api';
import type { Student } from '@/types/student';
import type { Interaction } from '@/types/interaction';
import type { ReasonCategory } from '@/types/reason';
import { StudentProfile } from '@/components/students/StudentProfile';
import { InteractionHistory } from '@/components/students/InteractionHistory';
import { InteractionDetail } from '@/components/interactions/InteractionDetail';
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
  
  // Modal state
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

      // Fetch interactions for this student using the API
      const interactionsResponse = await fetchStudentInteractions(id);

      if (interactionsResponse.error) {
        throw new Error(interactionsResponse.error.message);
      }

      // Fetch reason categories using the API
      const categoriesResponse = await fetchReasonCategories();

      if (categoriesResponse.error) {
        throw new Error(categoriesResponse.error.message);
      }

      const transformedStudent = studentResponse.data;
      const transformedInteractions = interactionsResponse.data || [];
      const transformedCategories = categoriesResponse.data || [];

      console.log('Fetched student:', transformedStudent);
      console.log('Fetched interactions:', transformedInteractions);

      // Calculate stats
      const interactionCount = transformedInteractions.length;
      const totalTimeSpent = transformedInteractions.reduce(
        (sum, interaction) => sum + interaction.durationMinutes,
        0
      );

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

  const handleInteractionClick = async (interactionId: string) => {
    // Find the interaction in the already-loaded interactions array
    const interaction = interactions.find(i => i.id === interactionId);
    
    if (interaction) {
      setSelectedInteraction(interaction);
      setIsDetailModalOpen(true);
    } else {
      console.error('Interaction not found:', interactionId);
    }
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
            <CardTitle className="flex items-center gap-2">
              Interaction History
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Your Interactions
              </span>
            </CardTitle>
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

      {/* Interaction Detail Modal */}
      <InteractionDetail
        interaction={selectedInteraction}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  );
}
