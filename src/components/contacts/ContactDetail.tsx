import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Contact } from '@/types/contact';
import type { Interaction } from '@/types/interaction';

interface ContactDetailProps {
  contact: Contact | null;
  interactions: Interaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddInteraction?: () => void;
  onEdit?: () => void;
  onDelete?: (contactId: string) => void;
}

export function ContactDetail({
  contact,
  interactions,
  open,
  onOpenChange,
  onAddInteraction,
  onEdit,
  onDelete,
}: ContactDetailProps) {
  // Filter interactions for this contact and sort by most recent
  const contactInteractions = useMemo(() => {
    if (!contact) return [];
    return interactions
      .filter(interaction => interaction.contactId === contact.id)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [contact, interactions]);

  const interactionCount = contactInteractions.length;

  // Get recent interactions (last 5)
  const recentInteractions = useMemo(() => {
    return contactInteractions.slice(0, 5);
  }, [contactInteractions]);

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-lg w-full sm:max-w-3xl h-full sm:h-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <DialogTitle className="text-xl sm:text-2xl">
                {contact.firstName} {contact.lastName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{contact.relationship}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 sm:flex-none">
                Edit
              </Button>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(contact.id)}
                  className="flex-1 sm:flex-none"
                >
                  Delete
                </Button>
              )}
              <Button size="sm" onClick={onAddInteraction} className="flex-1 sm:flex-none">
                Add Interaction
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contact.email && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact.email}</dd>
                </div>
              )}
              {contact.phone && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact.phone}</dd>
                </div>
              )}
              {contact.organization && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Organization</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact.organization}</dd>
                </div>
              )}
              {contact.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Interaction Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Interaction Summary</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-blue-600">Total Interactions</dt>
              <dd className="mt-2 text-3xl font-semibold text-blue-900">{interactionCount}</dd>
            </div>
          </div>

          {/* Recent Interactions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Interactions</h3>
            {recentInteractions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No interactions recorded yet
              </p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInteractions.map(interaction => (
                      <TableRow key={interaction.id}>
                        <TableCell>{formatDate(interaction.startTime)}</TableCell>
                        <TableCell>{formatTime(interaction.startTime)}</TableCell>
                        <TableCell>{formatDuration(interaction.durationMinutes)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {interaction.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {contactInteractions.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Showing 5 of {contactInteractions.length} interactions
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
