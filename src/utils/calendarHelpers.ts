import type { Interaction } from '@/types/interaction';
import type { EventInput } from '@fullcalendar/core';

/**
 * Get CSS class for event based on category name
 */
function getCategoryClass(categoryName: string): string {
  const normalized = categoryName.toLowerCase();

  if (normalized.includes('academic')) return 'event-academic';
  if (normalized.includes('behavior')) return 'event-behavioral';
  if (normalized.includes('social')) return 'event-social';
  if (normalized.includes('emotional') || normalized.includes('mental')) return 'event-emotional';
  if (normalized.includes('career')) return 'event-career';

  return 'event-other';
}

/**
 * Get background color for event based on category
 */
function getCategoryColor(categoryName: string, categoryColor?: string): string {
  if (categoryColor) return categoryColor;

  const normalized = categoryName.toLowerCase();

  if (normalized.includes('academic')) return '#3b82f6'; // blue
  if (normalized.includes('behavior')) return '#ef4444'; // red
  if (normalized.includes('social')) return '#10b981'; // green
  if (normalized.includes('emotional') || normalized.includes('mental')) return '#f59e0b'; // amber
  if (normalized.includes('career')) return '#8b5cf6'; // purple

  return '#6b7280'; // gray
}

/**
 * Transform interactions into FullCalendar events
 */
export function transformInteractionsToEvents(interactions: Interaction[]): EventInput[] {
  return interactions.map(interaction => {
    const categoryName = interaction.category?.name || 'Other';
    const categoryColor = interaction.category?.color;

    // Determine the title based on whether it's a student or contact interaction
    let title = '';
    if (interaction.student) {
      title = `${interaction.student.firstName} ${interaction.student.lastName}`;
    } else if (interaction.contact) {
      title = `${interaction.contact.firstName} ${interaction.contact.lastName}`;
    } else {
      title = 'Unknown';
    }

    // Add category to title
    title = `${title} - ${categoryName}`;

    return {
      id: interaction.id,
      title,
      start: interaction.startTime,
      end: interaction.endTime,
      backgroundColor: getCategoryColor(categoryName, categoryColor),
      borderColor: getCategoryColor(categoryName, categoryColor),
      className: getCategoryClass(categoryName),
      extendedProps: {
        interaction,
        categoryName,
        studentName: interaction.student
          ? `${interaction.student.firstName} ${interaction.student.lastName}`
          : undefined,
        contactName: interaction.contact
          ? `${interaction.contact.firstName} ${interaction.contact.lastName}`
          : undefined,
        durationMinutes: interaction.durationMinutes,
        notes: interaction.notes,
        needsFollowUp: interaction.needsFollowUp,
      },
    };
  });
}
