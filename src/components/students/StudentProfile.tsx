import type { Student } from '@/types/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StudentProfileProps {
  student: Student;
  onAddInteraction?: () => void;
}

export function StudentProfile({ student, onAddInteraction }: StudentProfileProps) {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Interaction button */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h2>
            {student.needsFollowUp && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                <svg
                  className="h-4 w-4 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Follow-up Needed
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Student ID: {student.studentId}
          </p>
        </div>
        <Button onClick={onAddInteraction}>Add Interaction</Button>
      </div>

      {/* Follow-up Alert */}
      {student.needsFollowUp && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Follow-up Needed
                </h3>
                {student.followUpNotes && (
                  <p className="mt-1 text-sm text-yellow-700">
                    {student.followUpNotes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Grade Level</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.gradeLevel}</dd>
            </div>
            {student.email && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{student.email}</dd>
              </div>
            )}
            {student.phone && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{student.phone}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Interaction Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Interaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-blue-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-blue-600">Total Interactions</dt>
              <dd className="mt-2 text-3xl font-semibold text-blue-900">
                {student.interactionCount || 0}
              </dd>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-green-600">Total Time Spent</dt>
              <dd className="mt-2 text-3xl font-semibold text-green-900">
                {student.totalTimeSpent ? formatTime(student.totalTimeSpent) : '0 minutes'}
              </dd>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-purple-600">Follow-up Status</dt>
              <dd className="mt-2 text-lg font-semibold text-purple-900">
                {student.needsFollowUp ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                    Needed
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    None
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
