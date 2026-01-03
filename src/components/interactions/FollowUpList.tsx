import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Interaction } from '@/types/interaction';

export interface FollowUpListProps {
  interactions: Interaction[];
  onMarkComplete?: (interaction: Interaction) => void;
  onViewInteraction?: (interaction: Interaction) => void;
  isLoading?: boolean;
}

export function FollowUpList({
  interactions,
  onMarkComplete,
  onViewInteraction,
  isLoading = false,
}: FollowUpListProps) {
  // Filter for pending follow-ups and sort by follow-up date (overdue first)
  const pendingFollowUps = useMemo(() => {
    const now = new Date();

    const pending = interactions.filter(
      interaction =>
        interaction.needsFollowUp && !interaction.isFollowUpComplete && interaction.followUpDate
    );

    // Sort: overdue first, then by follow-up date
    return pending.sort((a, b) => {
      const aDate = a.followUpDate ? new Date(a.followUpDate) : new Date();
      const bDate = b.followUpDate ? new Date(b.followUpDate) : new Date();

      const aOverdue = aDate < now;
      const bOverdue = bDate < now;

      // Overdue items come first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Within same category (both overdue or both not), sort by date
      return aDate.getTime() - bDate.getTime();
    });
  }, [interactions]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isOverdue = (followUpDate: Date) => {
    return new Date(followUpDate) < new Date();
  };

  const getStudentName = (interaction: Interaction) => {
    if (interaction.student) {
      return `${interaction.student.firstName} ${interaction.student.lastName}`;
    }
    if (interaction.contact) {
      return `${interaction.contact.firstName} ${interaction.contact.lastName}`;
    }
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading follow-ups...</p>
      </div>
    );
  }

  if (pendingFollowUps.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="h-12 w-12 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-muted-foreground">
            No pending follow-ups. Great job staying on top of things!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pendingFollowUps.length} pending follow-up
          {pendingFollowUps.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Follow-ups Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student/Contact</TableHead>
              <TableHead>Interaction Date</TableHead>
              <TableHead>Follow-up Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingFollowUps.map(interaction => {
              const overdue = interaction.followUpDate
                ? isOverdue(interaction.followUpDate)
                : false;

              return (
                <TableRow key={interaction.id} className={overdue ? 'bg-red-50' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{getStudentName(interaction)}</span>
                      {interaction.student && (
                        <span className="text-xs text-muted-foreground">
                          {interaction.student.studentId} - Grade {interaction.student.gradeLevel}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(interaction.startTime)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {interaction.followUpDate && (
                        <>
                          <span className={overdue ? 'text-red-700 font-medium' : ''}>
                            {formatDate(interaction.followUpDate)}
                          </span>
                          {overdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Overdue
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      {interaction.followUpNotes ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {interaction.followUpNotes}
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No notes</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onViewInteraction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewInteraction(interaction)}
                        >
                          View
                        </Button>
                      )}
                      {onMarkComplete && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onMarkComplete(interaction)}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
