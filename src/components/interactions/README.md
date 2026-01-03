# Interaction Components

This directory contains components for managing student and contact interactions, including follow-up tracking.

## Components

### FollowUpList

Displays a list of pending follow-ups with visual indicators for overdue items.

**Features:**

- Shows all pending follow-ups sorted by date (overdue first)
- Visual indicators for overdue follow-ups (red background)
- Displays student/contact name, interaction date, follow-up date, and notes
- "Mark Complete" button for each follow-up
- "View" button to see full interaction details

**Usage:**

```tsx
import { FollowUpList } from '@/components/interactions';

<FollowUpList
  interactions={interactions}
  onMarkComplete={interaction => handleMarkComplete(interaction)}
  onViewInteraction={interaction => handleView(interaction)}
  isLoading={isLoading}
/>;
```

### FollowUpCompleteModal

Modal dialog for marking follow-ups as complete with optional completion notes.

**Features:**

- Displays follow-up details (student/contact, date, original notes)
- Optional completion notes field
- Appends completion notes to interaction record with timestamp
- Updates interaction to mark follow-up as complete

**Usage:**

```tsx
import { FollowUpCompleteModal } from '@/components/interactions';

<FollowUpCompleteModal
  interaction={selectedInteraction}
  isOpen={isCompleteModalOpen}
  onClose={() => setIsCompleteModalOpen(false)}
  onComplete={async (interactionId, completionNotes) => {
    await completeFollowUp(interactionId, completionNotes);
  }}
/>;
```

### InteractionList

Enhanced with follow-up filtering and visual indicators.

**New Features:**

- Follow-up filter dropdown (All, Pending, Overdue, Completed)
- Follow-up status column with badges
- Red background highlighting for overdue follow-ups
- Follow-up status badges (Pending, Overdue, Completed)

## Follow-up Tracking Workflow

1. **Create Interaction with Follow-up**: When creating an interaction, check "Needs Follow-up" and set a follow-up date
2. **View Pending Follow-ups**: Navigate to Interactions page → Follow-ups tab
3. **Complete Follow-up**: Click "Mark Complete" on a follow-up item, add optional notes
4. **Track Status**: Follow-up indicators appear throughout the app:
   - Student profiles show follow-up badge
   - Student list shows follow-up count
   - Interaction list highlights overdue items

## Integration with useInteractions Hook

The `useInteractions` hook now includes a `completeFollowUp` method:

```tsx
const { completeFollowUp } = useInteractions();

// Complete a follow-up
await completeFollowUp(interactionId, 'Follow-up completed. Student is doing well.');
```

This method:

- Marks the interaction's `isFollowUpComplete` as true
- Appends completion notes to the interaction's notes field with timestamp
- Refreshes the interactions list
