# Common Form Components

This directory contains reusable form components built on top of Shadcn/ui primitives.

## Components

### FormInput

A text input component with label, validation feedback, and helper text.

```tsx
import { FormInput } from '@/components/common';

<FormInput
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
/>;
```

### FormSelect

A select dropdown component with label, validation feedback, and helper text.

```tsx
import { FormSelect } from '@/components/common';

<FormSelect
  label="Grade Level"
  options={[
    { value: '9', label: '9th Grade' },
    { value: '10', label: '10th Grade' },
  ]}
  error={errors.grade}
/>;
```

### FormTextarea

A textarea component for longer text input with label and validation.

```tsx
import { FormTextarea } from '@/components/common';

<FormTextarea label="Notes" placeholder="Enter your notes here..." rows={4} error={errors.notes} />;
```

### DateTimePicker

A date/time picker component with label and validation.

```tsx
import { DateTimePicker } from '@/components/common';

<DateTimePicker
  label="Start Time"
  type="datetime-local"
  value={startTime}
  onChange={setStartTime}
  error={errors.startTime}
/>;
```

### SearchableDropdown

A searchable dropdown with real-time filtering, keyboard navigation, and loading states.

```tsx
import { SearchableDropdown } from '@/components/common';

<SearchableDropdown
  label="Select Student"
  placeholder="Search students..."
  options={students.map(s => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName}`,
    subtitle: `Grade ${s.gradeLevel} - ${s.studentId}`,
  }))}
  value={selectedStudent}
  onChange={(value, option) => setSelectedStudent(value)}
  loading={isLoading}
  error={errors.student}
/>;
```

## Features

- Consistent styling with Shadcn/ui
- Built-in validation error display
- Helper text support
- Accessible with proper ARIA attributes
- TypeScript support with full type safety
- Keyboard navigation (SearchableDropdown)
- Loading and empty states (SearchableDropdown)
