import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InteractionForm } from '@/components/interactions/InteractionForm';
import type { InteractionFormData, Interaction } from '@/types/interaction';
import type { Student } from '@/types/student';
import type { Contact } from '@/types/contact';
import type { ReasonCategory, ReasonSubcategory } from '@/types/reason';

export interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interaction?: Interaction;
  prefilledDate?: Date;
  students: Student[];
  contacts: Contact[];
  categories: ReasonCategory[];
  subcategories: ReasonSubcategory[];
  onSubmit: (data: InteractionFormData) => Promise<void>;
  isLoading?: boolean;
}

export function EventModal({
  open,
  onOpenChange,
  interaction,
  prefilledDate,
  students,
  contacts,
  categories,
  subcategories,
  onSubmit,
  isLoading = false,
}: EventModalProps) {
  // Prepare initial data for the form
  const initialData: Partial<InteractionFormData> | undefined = interaction
    ? {
        type: interaction.studentId ? 'student' : 'contact',
        studentId: interaction.studentId,
        contactId: interaction.contactId,
        categoryId: interaction.categoryId,
        subcategoryId: interaction.subcategoryId,
        customReason: interaction.customReason,
        startTime: new Date(interaction.startTime).toISOString().slice(0, 16),
        durationMinutes: interaction.durationMinutes,
        notes: interaction.notes,
        needsFollowUp: interaction.needsFollowUp,
        followUpDate: interaction.followUpDate
          ? new Date(interaction.followUpDate).toISOString().slice(0, 10)
          : undefined,
        followUpNotes: interaction.followUpNotes,
      }
    : prefilledDate
      ? {
          startTime: new Date(prefilledDate).toISOString().slice(0, 16),
          type: 'student',
        }
      : undefined;

  const handleSubmit = async (data: InteractionFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {interaction ? 'Edit Interaction' : 'Create Interaction'}
          </DialogTitle>
        </DialogHeader>

        <InteractionForm
          initialData={initialData}
          students={students}
          contacts={contacts}
          categories={categories}
          subcategories={subcategories}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
          submitLabel={interaction ? 'Update Interaction' : 'Create Interaction'}
        />
      </DialogContent>
    </Dialog>
  );
}
