import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
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
  onStudentAdded?: (student: Student) => void; // Callback when a new student is added
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
  onStudentAdded,
  isLoading = false,
}: EventModalProps) {
  // Prepare initial data for the form
  const initialData: Partial<InteractionFormData> | undefined = interaction
    ? {
        type: interaction.studentId ? 'student' : 'contact',
        studentId: interaction.studentId ?? undefined,
        contactId: interaction.contactId ?? undefined,
        categoryId: interaction.categoryId,
        subcategoryId: interaction.subcategoryId ?? undefined,
        customReason: interaction.customReason ?? undefined,
        startTime: new Date(interaction.startTime).toISOString().slice(0, 16),
        durationMinutes: interaction.durationMinutes,
        notes: interaction.notes ?? undefined,
        needsFollowUp: interaction.needsFollowUp,
        followUpDate: interaction.followUpDate
          ? new Date(interaction.followUpDate).toISOString().slice(0, 10)
          : undefined,
        followUpNotes: interaction.followUpNotes ?? undefined,
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
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{interaction ? 'Edit Interaction' : 'Create Interaction'}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <InteractionForm
            initialData={initialData}
            students={students}
            contacts={contacts}
            categories={categories}
            subcategories={subcategories}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            onStudentAdded={onStudentAdded}
            isLoading={isLoading}
            submitLabel={interaction ? 'Update Interaction' : 'Create Interaction'}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
