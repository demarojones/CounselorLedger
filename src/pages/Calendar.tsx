import { useState, useRef, useMemo } from 'react';
import { CalendarView, EventModal, CalendarFilters } from '@/components/calendar';
import { InteractionDetail } from '@/components/interactions/InteractionDetail';
import { useInteractions } from '@/hooks/useInteractions';
import { transformInteractionsToEvents } from '@/utils/calendarHelpers';
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import type { Interaction, InteractionFormData } from '@/types/interaction';
import type { CalendarViewRef } from '@/components/calendar/CalendarView';

export function Calendar() {
  const {
    interactions,
    students,
    contacts,
    categories,
    subcategories,
    isLoading,
    createInteraction,
    updateInteraction,
    deleteInteraction,
  } = useInteractions();

  const calendarRef = useRef<CalendarViewRef>(null);
  const [selectedView, setSelectedView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter interactions by selected categories
  const filteredInteractions = useMemo(() => {
    if (selectedCategories.length === 0) {
      return interactions;
    }
    return interactions.filter((interaction) =>
      selectedCategories.includes(interaction.categoryId)
    );
  }, [interactions, selectedCategories]);

  // Transform interactions to calendar events
  const events = transformInteractionsToEvents(filteredInteractions);

  // Handle category filter toggle
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSelectedCategories([]);
  };

  // Handle view change
  const handleViewChange = (newView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setSelectedView(newView);
    calendarRef.current?.changeView(newView);
  };

  // Handle today button
  const handleToday = () => {
    calendarRef.current?.today();
  };

  // Handle event click - open detail modal
  const handleEventClick = (info: EventClickArg) => {
    const interaction = info.event.extendedProps.interaction as Interaction;
    setSelectedInteraction(interaction);
    setDetailModalOpen(true);
  };

  // Handle date select - open create modal with pre-filled date
  const handleDateSelect = (info: DateSelectArg) => {
    setPrefilledDate(info.start);
    setSelectedInteraction(null);
    setEventModalOpen(true);
  };

  // Handle event drop - update interaction start time
  const handleEventDrop = async (info: EventDropArg) => {
    const interaction = info.event.extendedProps.interaction as Interaction;
    const newStartTime = info.event.start;

    if (!newStartTime) {
      info.revert();
      return;
    }

    // Show confirmation
    const confirmed = window.confirm(
      `Reschedule this interaction to ${newStartTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}?`
    );

    if (!confirmed) {
      info.revert();
      return;
    }

    try {
      await updateInteraction(interaction.id, {
        startTime: newStartTime.toISOString(),
      });
    } catch (error) {
      console.error('Error rescheduling interaction:', error);
      info.revert();
      alert('Failed to reschedule interaction. Please try again.');
    }
  };

  // Handle edit from detail modal
  const handleEdit = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setDetailModalOpen(false);
    setEventModalOpen(true);
  };

  // Handle delete from detail modal
  const handleDelete = async (interaction: Interaction) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this interaction? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteInteraction(interaction.id);
      setDetailModalOpen(false);
      setSelectedInteraction(null);
    } catch (error) {
      console.error('Error deleting interaction:', error);
      alert('Failed to delete interaction. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle form submit (create or update)
  const handleFormSubmit = async (data: InteractionFormData) => {
    setIsSubmitting(true);
    try {
      if (selectedInteraction) {
        // Update existing interaction
        await updateInteraction(selectedInteraction.id, data);
      } else {
        // Create new interaction
        await createInteraction(data);
      }
      setEventModalOpen(false);
      setSelectedInteraction(null);
      setPrefilledDate(undefined);
    } catch (error) {
      console.error('Error saving interaction:', error);
      alert('Failed to save interaction. Please try again.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Calendar</h1>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="mt-2 text-gray-600">View and manage your counseling schedule.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <CalendarFilters
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            onClearFilters={handleClearFilters}
            view={selectedView}
            onViewChange={handleViewChange}
            onToday={handleToday}
          />
        </div>

        {/* Calendar */}
        <div className="lg:col-span-3">
          <CalendarView
            ref={calendarRef}
            events={events}
            view={selectedView}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            onEventDrop={handleEventDrop}
          />
        </div>
      </div>

      {/* Interaction Detail Modal */}
      <InteractionDetail
        interaction={selectedInteraction}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Create/Edit Interaction Modal */}
      <EventModal
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
        interaction={selectedInteraction || undefined}
        prefilledDate={prefilledDate}
        students={students}
        contacts={contacts}
        categories={categories}
        subcategories={subcategories}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
