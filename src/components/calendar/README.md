# Calendar Components

This directory contains components for the calendar interface that displays and manages counseling interactions.

## Components

### CalendarView

The main calendar component built with FullCalendar. Displays interactions as events with support for multiple views (month, week, day).

**Features:**

- Month, week, and day views
- Time grid display (7 AM - 6 PM)
- Color-coded events by category
- Event tooltips with interaction details
- Drag-and-drop to reschedule
- Click to view details
- Click empty date to create new interaction

**Props:**

- `events`: Array of calendar events (transformed from interactions)
- `view`: Current view type ('dayGridMonth' | 'timeGridWeek' | 'timeGridDay')
- `onEventClick`: Handler for clicking an event
- `onDateSelect`: Handler for selecting a date/time
- `onEventDrop`: Handler for drag-and-drop rescheduling

**Ref Methods:**

- `changeView(view)`: Change the calendar view
- `today()`: Navigate to today
- `next()`: Navigate to next period
- `prev()`: Navigate to previous period

### EventModal

Modal dialog for creating and editing interactions from the calendar.

**Features:**

- Create new interaction with pre-filled date
- Edit existing interaction
- Full interaction form with validation
- Student/contact selection
- Category and subcategory selection
- Duration and time calculation

**Props:**

- `open`: Modal open state
- `onOpenChange`: Handler for modal state changes
- `interaction`: Existing interaction to edit (optional)
- `prefilledDate`: Pre-filled date for new interaction (optional)
- `students`: Array of students
- `contacts`: Array of contacts
- `categories`: Array of reason categories
- `subcategories`: Array of reason subcategories
- `onSubmit`: Handler for form submission
- `isLoading`: Loading state during submission

### CalendarFilters

Sidebar component with calendar controls and category filters.

**Features:**

- View switcher (Month/Week/Day)
- Today button
- Category filter checkboxes
- Color indicators for categories
- Clear filters button

**Props:**

- `categories`: Array of reason categories
- `selectedCategories`: Array of selected category IDs
- `onCategoryToggle`: Handler for toggling category filter
- `onClearFilters`: Handler for clearing all filters
- `view`: Current view type
- `onViewChange`: Handler for view changes
- `onToday`: Handler for today button

## Utilities

### calendarHelpers.ts

Utility functions for calendar operations:

- `transformInteractionsToEvents(interactions)`: Converts interaction objects to FullCalendar event format
- `formatDuration(minutes)`: Formats duration in minutes to human-readable string
- `getCategoryColor(categoryName, categoryColor)`: Gets color for event based on category
- `getCategoryClass(categoryName)`: Gets CSS class for event styling

## Styling

### calendar.css

Custom CSS for FullCalendar to match the application theme:

- Custom color scheme using Tailwind colors
- Button styling
- Event styling with hover effects
- Category-specific event colors
- Responsive design

**Event Color Classes:**

- `.event-academic`: Blue (#3b82f6)
- `.event-behavioral`: Red (#ef4444)
- `.event-social`: Green (#10b981)
- `.event-emotional`: Amber (#f59e0b)
- `.event-career`: Purple (#8b5cf6)
- `.event-other`: Gray (#6b7280)

## Usage Example

```tsx
import { CalendarView, EventModal, CalendarFilters } from '@/components/calendar';
import { useInteractions } from '@/hooks/useInteractions';
import { transformInteractionsToEvents } from '@/utils/calendarHelpers';

function CalendarPage() {
  const { interactions, categories } = useInteractions();
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Filter interactions
  const filteredInteractions = interactions.filter(
    i => selectedCategories.length === 0 || selectedCategories.includes(i.categoryId)
  );

  // Transform to events
  const events = transformInteractionsToEvents(filteredInteractions);

  return (
    <div>
      <CalendarFilters
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={id => {
          /* toggle logic */
        }}
        onClearFilters={() => setSelectedCategories([])}
        view="dayGridMonth"
        onViewChange={view => {
          /* change view */
        }}
        onToday={() => {
          /* go to today */
        }}
      />

      <CalendarView
        events={events}
        onEventClick={info => {
          /* show detail */
        }}
        onDateSelect={info => {
          /* create interaction */
        }}
        onEventDrop={info => {
          /* reschedule */
        }}
      />
    </div>
  );
}
```

## Requirements Satisfied

- **3.1**: Calendar displays interactions as events with time slots, color-coded by category
- **3.2**: Click on calendar date allows adding new interactions for that date
- **3.3**: Click on existing interaction event allows editing or deleting
- **3.4**: Drag-and-drop allows rescheduling to different time slots
- **3.5**: Events show student/contact name, category, time, and duration

## Dependencies

- `@fullcalendar/react`: React wrapper for FullCalendar
- `@fullcalendar/core`: Core FullCalendar functionality
- `@fullcalendar/daygrid`: Month view plugin
- `@fullcalendar/timegrid`: Week/day view plugin
- `@fullcalendar/interaction`: Drag-and-drop and selection plugin
