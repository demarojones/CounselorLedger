import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  InteractionForm,
  InteractionList,
  InteractionDetail,
  FollowUpList,
  FollowUpCompleteModal,
} from '@/components/interactions';
import { useInteractions } from '@/hooks/useInteractions';
import { createInteraction, updateInteraction, deleteInteraction, completeFollowUp } from '@/services/api';
import { handleFormSubmission } from '@/utils/formSubmission';
import type { Interaction, InteractionFormData } from '@/types/interaction';

export function Interactions() {
  const {
    interactions,
    students,
    contacts,
    categories,
    subcategories,
    isLoading,
    error,
    refreshInteractions,
  } = useInteractions();

  const [activeTab, setActiveTab] = useState<'all' | 'followups'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] =
    useState<Interaction | null>(null);
  const [editingInteraction, setEditingInteraction] =
    useState<Interaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateClick = () => {
    setEditingInteraction(null);
    setIsFormOpen(true);
  };

  const handleView = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setIsDetailOpen(true);
  };

  const handleEdit = (interaction: Interaction) => {
    setEditingInteraction(interaction);
    setIsFormOpen(true);
  };

  const handleDelete = async (interaction: Interaction) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this interaction? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    
    const result = await handleFormSubmission(
      () => deleteInteraction(interaction.id),
      {
        successMessage: 'Interaction deleted successfully',
        onSuccess: () => {
          setIsDetailOpen(false);
          setSelectedInteraction(null);
          refreshInteractions();
        },
        showErrorToast: true,
      }
    );

    setIsDeleting(false);
  };

  const handleSubmit = async (data: InteractionFormData) => {
    setIsSubmitting(true);
    
    if (editingInteraction) {
      const result = await handleFormSubmission(
        () => updateInteraction(editingInteraction.id, data),
        {
          successMessage: 'Interaction updated successfully',
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingInteraction(null);
            refreshInteractions();
          },
          showErrorToast: true,
        }
      );
    } else {
      const result = await handleFormSubmission(
        () => createInteraction(data),
        {
          successMessage: 'Interaction created successfully',
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingInteraction(null);
            refreshInteractions();
          },
          showErrorToast: true,
        }
      );
    }
    
    setIsSubmitting(false);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingInteraction(null);
  };

  const handleMarkComplete = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setIsCompleteModalOpen(true);
  };

  const handleCompleteFollowUp = async (
    interactionId: string,
    completionNotes: string
  ) => {
    const result = await handleFormSubmission(
      () => completeFollowUp(interactionId, completionNotes),
      {
        successMessage: 'Follow-up completed successfully',
        onSuccess: () => {
          setIsCompleteModalOpen(false);
          setSelectedInteraction(null);
          refreshInteractions();
        },
        showErrorToast: true,
      }
    );

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to complete follow-up');
    }
  };

  // Convert interaction to form data for editing
  const getInitialFormData = (
    interaction: Interaction
  ): Partial<InteractionFormData> => {
    return {
      type: interaction.studentId ? 'student' : 'contact',
      studentId: interaction.studentId,
      contactId: interaction.contactId,
      categoryId: interaction.categoryId,
      subcategoryId: interaction.subcategoryId,
      customReason: interaction.customReason,
      startTime: new Date(interaction.startTime)
        .toISOString()
        .slice(0, 16),
      durationMinutes: interaction.durationMinutes,
      notes: interaction.notes,
      needsFollowUp: interaction.needsFollowUp,
      followUpDate: interaction.followUpDate
        ? new Date(interaction.followUpDate).toISOString().split('T')[0]
        : undefined,
      followUpNotes: interaction.followUpNotes,
    };
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Interactions</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Track and manage student and contact interactions.
          </p>
        </div>
        <Button onClick={handleCreateClick} disabled={isLoading} className="w-full sm:w-auto">
          Add Interaction
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`
              whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            All Interactions
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`
              whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'followups'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Follow-ups
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' ? (
        <InteractionList
          interactions={interactions}
          students={students}
          contacts={contacts}
          categories={categories}
          onView={handleView}
          onEdit={handleEdit}
          isLoading={isLoading}
        />
      ) : (
        <FollowUpList
          interactions={interactions}
          onMarkComplete={handleMarkComplete}
          onViewInteraction={handleView}
          isLoading={isLoading}
        />
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-lg w-full sm:max-w-3xl h-full sm:h-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInteraction ? 'Edit Interaction' : 'Add New Interaction'}
            </DialogTitle>
          </DialogHeader>
          <InteractionForm
            initialData={
              editingInteraction
                ? getInitialFormData(editingInteraction)
                : undefined
            }
            students={students}
            contacts={contacts}
            categories={categories}
            subcategories={subcategories}
            onSubmit={handleSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
            submitLabel={editingInteraction ? 'Update Interaction' : 'Create Interaction'}
          />
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <InteractionDetail
        interaction={selectedInteraction}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Follow-up Complete Modal */}
      <FollowUpCompleteModal
        interaction={selectedInteraction}
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setSelectedInteraction(null);
        }}
        onComplete={handleCompleteFollowUp}
      />
    </div>
  );
}
