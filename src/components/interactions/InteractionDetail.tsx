import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Interaction } from '@/types/interaction';

export interface InteractionDetailProps {
  interaction: Interaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (interaction: Interaction) => void;
  onDelete?: (interaction: Interaction) => void;
  isDeleting?: boolean;
}

export function InteractionDetail({
  interaction,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  isDeleting = false,
}: InteractionDetailProps) {
  if (!interaction) return null;

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const getPersonInfo = () => {
    if (interaction.student) {
      return {
        type: 'Student',
        name: `${interaction.student.firstName} ${interaction.student.lastName}`,
        details: `${interaction.student.studentId} - Grade ${interaction.student.gradeLevel}`,
      };
    }
    if (interaction.contact) {
      return {
        type: 'Contact',
        name: `${interaction.contact.firstName} ${interaction.contact.lastName}`,
        details: `${interaction.contact.relationship}${interaction.contact.organization ? ` - ${interaction.contact.organization}` : ''}`,
      };
    }
    return {
      type: 'Unknown',
      name: 'Unknown',
      details: '',
    };
  };

  const personInfo = getPersonInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-lg w-full sm:max-w-2xl h-full sm:h-auto">
        <DialogHeader>
          <DialogTitle>Interaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Person Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {personInfo.type}
            </h3>
            <div>
              <p className="text-lg font-semibold">{personInfo.name}</p>
              {personInfo.details && (
                <p className="text-sm text-muted-foreground">
                  {personInfo.details}
                </p>
              )}
            </div>
          </div>

          {/* Regarding Student Information (for contact interactions) */}
          {interaction.contact && interaction.regardingStudent && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-md border-l-4 border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">
                Regarding Student
              </h3>
              <div>
                <p className="font-medium text-blue-900">
                  {interaction.regardingStudent.firstName} {interaction.regardingStudent.lastName}
                </p>
                <p className="text-sm text-blue-700">
                  {interaction.regardingStudent.studentId} - Grade {interaction.regardingStudent.gradeLevel}
                </p>
              </div>
            </div>
          )}

          {/* Category Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Reason
            </h3>
            <div>
              <p className="font-medium">
                {interaction.category?.name || 'Unknown Category'}
              </p>
              {interaction.subcategory && (
                <p className="text-sm text-muted-foreground">
                  {interaction.subcategory.name}
                </p>
              )}
              {interaction.customReason && (
                <p className="text-sm italic mt-1">
                  Custom: {interaction.customReason}
                </p>
              )}
            </div>
          </div>

          {/* Time Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Start Time
              </h3>
              <p>{formatDateTime(interaction.startTime)}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                End Time
              </h3>
              <p>{formatDateTime(interaction.endTime)}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Duration
            </h3>
            <p>{formatDuration(interaction.durationMinutes)}</p>
          </div>

          {/* Counselor */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Counselor
            </h3>
            <p>
              {interaction.counselor
                ? `${interaction.counselor.firstName} ${interaction.counselor.lastName}`
                : 'Unknown'}
            </p>
          </div>

          {/* Notes */}
          {interaction.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Notes
              </h3>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">
                  {interaction.notes}
                </p>
              </div>
            </div>
          )}

          {/* Follow-up Information */}
          {interaction.needsFollowUp && (
            <div className="space-y-4 p-4 border-l-4 border-primary bg-primary/5 rounded-r-md">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Follow-up Required</h3>
                {interaction.isFollowUpComplete ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                )}
              </div>

              {interaction.followUpDate && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Follow-up Date
                  </p>
                  <p className="text-sm">
                    {formatDate(interaction.followUpDate)}
                  </p>
                </div>
              )}

              {interaction.followUpNotes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Follow-up Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {interaction.followUpNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Created:</span>
              <span>{formatDateTime(interaction.createdAt)}</span>
            </div>
            {interaction.updatedAt &&
              interaction.updatedAt !== interaction.createdAt && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Last Updated:</span>
                  <span>{formatDateTime(interaction.updatedAt)}</span>
                </div>
              )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row justify-between w-full gap-3">
            <div className="order-2 sm:order-1">
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => onDelete(interaction)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              {onEdit && (
                <Button
                  onClick={() => {
                    onEdit(interaction);
                    onOpenChange(false);
                  }}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
