import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormTextarea } from '@/components/common/FormTextarea';
import type { Interaction } from '@/types/interaction';

export interface FollowUpCompleteModalProps {
  interaction: Interaction | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (interactionId: string, completionNotes: string) => Promise<void>;
}

export function FollowUpCompleteModal({
  interaction,
  isOpen,
  onClose,
  onComplete,
}: FollowUpCompleteModalProps) {
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!interaction) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete(interaction.id, completionNotes);
      setCompletionNotes('');
      onClose();
    } catch (err) {
      console.error('Error completing follow-up:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCompletionNotes('');
      setError(null);
      onClose();
    }
  };

  const getStudentName = () => {
    if (!interaction) return '';
    if (interaction.student) {
      return `${interaction.student.firstName} ${interaction.student.lastName}`;
    }
    if (interaction.contact) {
      return `${interaction.contact.firstName} ${interaction.contact.lastName}`;
    }
    return 'Unknown';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Complete Follow-up</DialogTitle>
            <DialogDescription>
              Mark this follow-up as complete and add any completion notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Follow-up Details */}
            {interaction && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm font-medium">Student/Contact:</span>
                  <p className="text-sm text-muted-foreground">{getStudentName()}</p>
                </div>
                {interaction.followUpDate && (
                  <div>
                    <span className="text-sm font-medium">Follow-up Date:</span>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(interaction.followUpDate)}
                    </p>
                  </div>
                )}
                {interaction.followUpNotes && (
                  <div>
                    <span className="text-sm font-medium">Original Notes:</span>
                    <p className="text-sm text-muted-foreground">{interaction.followUpNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Completion Notes */}
            <div className="space-y-2">
              <FormTextarea
                label="Completion Notes (Optional)"
                placeholder="Add any notes about completing this follow-up..."
                value={completionNotes}
                onChange={e => setCompletionNotes(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                These notes will be added to the interaction record.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Completing...' : 'Mark Complete'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
