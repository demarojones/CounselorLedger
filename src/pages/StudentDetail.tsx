import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudent } from '@/hooks/useStudents';
import { useInteractions } from '@/hooks/useInteractions';
import { StudentProfile } from '@/components/students/StudentProfile';
import { InteractionHistory } from '@/components/students/InteractionHistory';
import { InteractionDetail } from '@/components/interactions/InteractionDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

export function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  // Use React Query hooks
  const { data: student, isLoading: studentLoading, error: studentError } = useStudent(studentId || '');
  const { interactions: allInteractions, categories, isLoading: interactionsLoading } = useInteractions();

  // Filter interactions for this student
  const interactions = useMemo(() => {
    if (!studentId) return [];
    return allInteractions.filter(
      interaction => interaction.studentId === studentId || interaction.regardingStudentId === studentId
    );
  }, [allInteractions, studentId]);

  // Calculate stats
  const studentWithStats = useMemo(() => {
    if (!student) return null;
    
    const interactionCount = interactions.length;
    const totalTimeSpent = interactions.reduce(
      (sum, interaction) => sum + interaction.durationMinutes,
      0
    );

    return {
      ...student,
      interactionCount,
      totalTimeSpent,
    };
  }, [student, interactions]);

  const loading = studentLoading || interactionsLoading;
  const error = studentError ? (studentError as Error).message : null;

  // Modal state
  const [selectedInteraction, setSelectedInteraction] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleAddInteraction = () => {
    // Navigate to interactions page with student pre-populated
    navigate(`/interactions?studentId=${studentId}`);
  };

  const handleInteractionClick = (interactionId: string) => {
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

  if (error || !studentWithStats) {
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
      <StudentProfile student={studentWithStats} onAddInteraction={handleAddInteraction} />

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
