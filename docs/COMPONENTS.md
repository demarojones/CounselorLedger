# Component Documentation

This document provides detailed information about the key components in the School Counselor Ledger application.

## Table of Contents

- [Common Components](#common-components)
  - [SearchableDropdown](#searchabledropdown)
  - [FormInput](#forminput)
  - [FormSelect](#formselect)
  - [FormTextarea](#formtextarea)
  - [DateTimePicker](#datetimepicker)
  - [LoadingSpinner](#loadingspinner)
- [Interaction Components](#interaction-components)
  - [InteractionForm](#interactionform)
  - [InteractionList](#interactionlist)
  - [InteractionDetail](#interactiondetail)
- [Student Components](#student-components)
  - [StudentList](#studentlist)
  - [StudentProfile](#studentprofile)
  - [StudentSearch](#studentsearch)
- [Contact Components](#contact-components)
  - [ContactList](#contactlist)
  - [ContactForm](#contactform)
  - [ContactDetail](#contactdetail)

---

## Common Components

### SearchableDropdown

A reusable dropdown component with real-time search filtering and keyboard navigation.

**Location:** `src/components/common/SearchableDropdown.tsx`

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | No | - | Label text displayed above the dropdown |
| `placeholder` | `string` | No | `"Search..."` | Placeholder text in the search input |
| `options` | `SearchableDropdownOption[]` | Yes | - | Array of options to display |
| `value` | `string` | No | - | Currently selected value |
| `onChange` | `(value: string, option: SearchableDropdownOption \| null) => void` | No | - | Callback when selection changes |
| `onSearch` | `(query: string) => void` | No | - | Callback when search query changes |
| `error` | `string` | No | - | Error message to display |
| `helperText` | `string` | No | - | Helper text displayed below input |
| `loading` | `boolean` | No | `false` | Shows loading state |
| `disabled` | `boolean` | No | `false` | Disables the dropdown |
| `required` | `boolean` | No | `false` | Marks field as required |
| `className` | `string` | No | - | Additional CSS classes |
| `emptyMessage` | `string` | No | `"No results found"` | Message shown when no options match |
| `filterFn` | `(option, query) => boolean` | No | - | Custom filter function |

**SearchableDropdownOption Interface:**

```typescript
interface SearchableDropdownOption {
  value: string;        // Unique identifier
  label: string;        // Main display text
  subtitle?: string;    // Optional secondary text
  metadata?: Record<string, any>;  // Additional data
}
```

**Usage Example:**

```tsx
import { SearchableDropdown } from '@/components/common/SearchableDropdown';

function MyComponent() {
  const [selectedStudent, setSelectedStudent] = useState('');
  
  const studentOptions = students.map(student => ({
    value: student.id,
    label: `${student.firstName} ${student.lastName}`,
    subtitle: `${student.studentId} - Grade ${student.gradeLevel}`
  }));

  return (
    <SearchableDropdown
      label="Select Student"
      placeholder="Search for a student..."
      options={studentOptions}
      value={selectedStudent}
      onChange={(value) => setSelectedStudent(value)}
      required
    />
  );
}
```

**Features:**
- Real-time search filtering
- Keyboard navigation (Arrow keys, Enter, Escape, Tab)
- Accessibility support (ARIA attributes)
- Click-outside to close
- Highlighted selection
- Loading and empty states

---

### FormInput

A styled input component with label, error handling, and validation feedback.

**Location:** `src/components/common/FormInput.tsx`

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | No | - | Label text |
| `error` | `string` | No | - | Error message |
| `helperText` | `string` | No | - | Helper text |
| `required` | `boolean` | No | `false` | Marks as required |
| All standard HTML input props | - | - | - | Supports all native input attributes |

**Usage Example:**

```tsx
<FormInput
  label="Student ID"
  type="text"
  placeholder="Enter student ID..."
  value={studentId}
  onChange={(e) => setStudentId(e.target.value)}
  error={errors.studentId}
  required
/>
```

---

### FormSelect

A styled select dropdown with label and error handling.

**Location:** `src/components/common/FormSelect.tsx`

**Usage Example:**

```tsx
<FormSelect
  label="Grade Level"
  value={gradeLevel}
  onChange={(e) => setGradeLevel(e.target.value)}
  error={errors.gradeLevel}
  required
>
  <option value="">Select grade level</option>
  <option value="9">9th Grade</option>
  <option value="10">10th Grade</option>
  <option value="11">11th Grade</option>
  <option value="12">12th Grade</option>
</FormSelect>
```

---

### FormTextarea

A styled textarea component with label and error handling.

**Location:** `src/components/common/FormTextarea.tsx`

**Usage Example:**

```tsx
<FormTextarea
  label="Notes"
  placeholder="Add any relevant notes..."
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={4}
/>
```

---

### DateTimePicker

A date/time input component with proper formatting.

**Location:** `src/components/common/DateTimePicker.tsx`

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'date' \| 'time' \| 'datetime-local'` | Yes | Type of picker |
| `label` | `string` | No | Label text |
| `value` | `string` | No | Current value (ISO format) |
| `onChange` | `(value: string) => void` | No | Change callback |
| `error` | `string` | No | Error message |
| `required` | `boolean` | No | Marks as required |

**Usage Example:**

```tsx
<DateTimePicker
  label="Start Time"
  type="datetime-local"
  value={startTime}
  onChange={(value) => setStartTime(value)}
  required
/>
```

---

### LoadingSpinner

A loading spinner component with size variants.

**Location:** `src/components/common/LoadingSpinner.tsx`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size |

**Usage Example:**

```tsx
{isLoading && <LoadingSpinner size="lg" />}
```

---

## Interaction Components

### InteractionForm

A comprehensive form for creating and editing interactions with students or contacts.

**Location:** `src/components/interactions/InteractionForm.tsx`

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `initialData` | `Partial<InteractionFormData>` | No | Pre-fill form data for editing |
| `students` | `Student[]` | Yes | Array of available students |
| `contacts` | `Contact[]` | Yes | Array of available contacts |
| `categories` | `ReasonCategory[]` | Yes | Interaction reason categories |
| `subcategories` | `ReasonSubcategory[]` | Yes | Interaction reason subcategories |
| `onSubmit` | `(data: InteractionFormData) => void \| Promise<void>` | Yes | Submit callback |
| `onCancel` | `() => void` | No | Cancel callback |
| `isLoading` | `boolean` | No | Shows loading state |
| `submitLabel` | `string` | No | Custom submit button text |

**InteractionFormData Interface:**

```typescript
interface InteractionFormData {
  type: 'student' | 'contact';
  studentId?: string;
  contactId?: string;
  categoryId: string;
  subcategoryId?: string;
  customReason?: string;
  startTime: string;
  durationMinutes: number;
  notes?: string;
  needsFollowUp: boolean;
  followUpDate?: string;
  followUpNotes?: string;
}
```

**Usage Example:**

```tsx
import { InteractionForm } from '@/components/interactions/InteractionForm';

function CreateInteractionModal() {
  const { students, contacts, categories, subcategories, createInteraction } = useInteractions();

  const handleSubmit = async (data: InteractionFormData) => {
    await createInteraction(data);
    onClose();
  };

  return (
    <InteractionForm
      students={students}
      contacts={contacts}
      categories={categories}
      subcategories={subcategories}
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitLabel="Create Interaction"
    />
  );
}
```

**Features:**
- Toggle between student and contact interactions
- Searchable student/contact selection
- Category and subcategory dropdowns
- Custom reason field (shown when "Custom" subcategory selected)
- Start time and duration inputs
- Automatic end time calculation
- Notes textarea
- Follow-up checkbox with conditional fields
- Form validation with Zod
- Responsive layout

---

### InteractionList

Displays a table of interactions with filtering and sorting.

**Location:** `src/components/interactions/InteractionList.tsx`

**Features:**
- Sortable columns
- Date range filtering
- Category filtering
- Student/contact filtering
- View and edit actions
- Pagination
- Responsive table layout

---

### InteractionDetail

Modal showing detailed information about an interaction.

**Location:** `src/components/interactions/InteractionDetail.tsx`

**Features:**
- Full interaction details
- Student/contact information
- Category and subcategory
- Start time, duration, and calculated end time
- Notes display
- Follow-up information
- Edit and delete actions

---

## Student Components

### StudentList

Displays a table of all students with interaction statistics.

**Location:** `src/components/students/StudentList.tsx`

**Features:**
- Student ID, name, and grade level
- Interaction count
- Total time spent
- Follow-up needed indicator
- Sortable columns
- Search functionality
- Click to view profile

---

### StudentProfile

Displays detailed student information and interaction history.

**Location:** `src/components/students/StudentProfile.tsx`

**Features:**
- Student basic information
- Interaction statistics
- Follow-up status
- "Add Interaction" button (pre-fills student)
- Interaction history component

---

### StudentSearch

Searchable dropdown specifically for student selection.

**Location:** `src/components/students/StudentSearch.tsx`

**Features:**
- Real-time search
- Displays student ID and grade level
- Navigate to profile on selection

---

## Contact Components

### ContactList

Displays a table of all contacts with interaction counts.

**Location:** `src/components/contacts/ContactList.tsx`

**Features:**
- Name, relationship, and organization
- Email and phone
- Interaction count
- View and edit actions
- Sortable columns
- Search functionality

---

### ContactForm

Form for creating and editing contacts.

**Location:** `src/components/contacts/ContactForm.tsx`

**Fields:**
- First name and last name
- Relationship type
- Email and phone
- Organization
- Notes

**Features:**
- Form validation
- Create and update modes
- Error handling
- Success feedback

---

### ContactDetail

Modal showing detailed contact information and interaction history.

**Location:** `src/components/contacts/ContactDetail.tsx`

**Features:**
- Full contact details
- Interaction history
- Interaction count
- "Add Interaction" button
- Edit and delete actions

---

## Best Practices

### Component Usage

1. **Always provide required props** - Check the component documentation for required props
2. **Handle loading states** - Use the `isLoading` prop when available
3. **Provide error feedback** - Pass error messages to form components
4. **Use TypeScript** - Leverage type checking for props
5. **Follow accessibility guidelines** - Components include ARIA attributes

### Form Validation

All form components support validation through the `error` prop:

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

// Validate and set errors
if (!studentId) {
  setErrors(prev => ({ ...prev, studentId: 'Student is required' }));
}

// Pass to component
<FormInput
  label="Student ID"
  value={studentId}
  error={errors.studentId}
  onChange={(e) => {
    setStudentId(e.target.value);
    setErrors(prev => ({ ...prev, studentId: '' })); // Clear error on change
  }}
/>
```

### Responsive Design

All components are responsive and adapt to mobile screens:
- Tables become scrollable on mobile
- Forms stack vertically
- Modals become full-screen on small devices
- Touch-friendly tap targets

### Styling

Components use Tailwind CSS and follow the design system:
- Consistent spacing and typography
- Theme colors from `tailwind.config.js`
- Dark mode support (where applicable)
- Shadcn/ui base components

---

## Additional Resources

- [Hooks Documentation](./HOOKS.md)
- [Utility Functions](./UTILITIES.md)
- [API Integration](./API.md)
- [Styling Guide](../STYLING_GUIDE.md)
