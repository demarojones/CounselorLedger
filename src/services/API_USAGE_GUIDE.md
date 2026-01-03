# API Usage Guide

This guide shows how to use the new API layer to handle Supabase operations for contacts, students, and interactions.

## Overview

The API layer (`src/services/api.ts`) provides high-level functions for managing data in Supabase. It handles:
- Data transformation (snake_case ↔ camelCase)
- Tenant context management
- Error handling
- Type safety

## Basic Usage Pattern

All API functions follow this pattern:

```typescript
import { createContact, updateStudent, createInteraction } from '@/services/api';
import { handleFormSubmission } from '@/utils/formSubmission';

// In your form submission handler
const handleSubmit = async (formData) => {
  const result = await handleFormSubmission(
    () => createContact(formData),
    {
      successMessage: 'Contact created successfully',
      onSuccess: (newContact) => {
        // Update UI with new contact
        setContacts([...contacts, newContact]);
      },
    }
  );
};
```

## Students API

### Fetch all students

```typescript
import { fetchStudents } from '@/services/api';

const { data: students, error } = await fetchStudents();

if (error) {
  console.error('Failed to fetch students:', error.message);
} else {
  console.log('Students:', students);
}
```

### Fetch a single student

```typescript
import { fetchStudent } from '@/services/api';

const { data: student, error } = await fetchStudent(studentId);
```

### Create a student

```typescript
import { createStudent } from '@/services/api';
import { handleFormSubmission } from '@/utils/formSubmission';

const handleCreateStudent = async (formData) => {
  const result = await handleFormSubmission(
    () => createStudent({
      studentId: formData.studentId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      gradeLevel: formData.gradeLevel,
      email: formData.email,
      phone: formData.phone,
    }),
    {
      successMessage: 'Student created successfully',
      onSuccess: (newStudent) => {
        setStudents([...students, newStudent]);
      },
    }
  );
};
```

### Update a student

```typescript
import { updateStudent } from '@/services/api';

const { data: updatedStudent, error } = await updateStudent(studentId, {
  firstName: 'John',
  gradeLevel: '10',
  needsFollowUp: true,
});
```

### Delete a student

```typescript
import { deleteStudent } from '@/services/api';

const { data, error } = await deleteStudent(studentId);
```

## Contacts API

### Fetch all contacts

```typescript
import { fetchContacts } from '@/services/api';

const { data: contacts, error } = await fetchContacts();
```

### Create a contact

```typescript
import { createContact } from '@/services/api';
import { handleFormSubmission } from '@/utils/formSubmission';

const handleCreateContact = async (formData) => {
  const result = await handleFormSubmission(
    () => createContact({
      firstName: formData.firstName,
      lastName: formData.lastName,
      relationship: formData.relationship,
      email: formData.email,
      phone: formData.phone,
      organization: formData.organization,
      notes: formData.notes,
    }),
    {
      successMessage: 'Contact created successfully',
      onSuccess: (newContact) => {
        setContacts([...contacts, newContact]);
      },
    }
  );
};
```

### Update a contact

```typescript
import { updateContact } from '@/services/api';

const { data: updatedContact, error } = await updateContact(contactId, {
  firstName: 'Jane',
  relationship: 'Parent',
});
```

### Delete a contact

```typescript
import { deleteContact } from '@/services/api';

const { data, error } = await deleteContact(contactId);
```

## Interactions API

### Fetch all interactions

```typescript
import { fetchInteractions } from '@/services/api';

const { data: interactions, error } = await fetchInteractions();
```

### Create an interaction

```typescript
import { createInteraction } from '@/services/api';
import { handleFormSubmission } from '@/utils/formSubmission';

const handleCreateInteraction = async (formData) => {
  const result = await handleFormSubmission(
    () => createInteraction({
      type: 'student', // or 'contact'
      studentId: formData.studentId,
      contactId: formData.contactId,
      regardingStudentId: formData.regardingStudentId,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      customReason: formData.customReason,
      startTime: formData.startTime,
      durationMinutes: formData.durationMinutes,
      notes: formData.notes,
      needsFollowUp: formData.needsFollowUp,
      followUpDate: formData.followUpDate,
      followUpNotes: formData.followUpNotes,
    }),
    {
      successMessage: 'Interaction created successfully',
      onSuccess: (newInteraction) => {
        setInteractions([...interactions, newInteraction]);
      },
    }
  );
};
```

### Update an interaction

```typescript
import { updateInteraction } from '@/services/api';

const { data: updatedInteraction, error } = await updateInteraction(interactionId, {
  notes: 'Updated notes',
  needsFollowUp: true,
});
```

### Delete an interaction

```typescript
import { deleteInteraction } from '@/services/api';

const { data, error } = await deleteInteraction(interactionId);
```

### Complete a follow-up

```typescript
import { completeFollowUp } from '@/services/api';

const { data: updatedInteraction, error } = await completeFollowUp(
  interactionId,
  'Follow-up completed. Student is doing well.'
);
```

## Form Submission Example

Here's a complete example of how to integrate the API into a form component:

```typescript
import { useState } from 'react';
import { createContact } from '@/services/api';
import { handleFormSubmission, prepareFormData } from '@/utils/formSubmission';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/common/FormInput';

export function ContactFormExample() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: '',
    email: '',
    phone: '',
    organization: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Prepare and validate form data
    const { valid, data, errors: validationErrors } = prepareFormData(formData, [
      'firstName',
      'lastName',
      'relationship',
    ]);

    if (!valid) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    // Submit to API
    const result = await handleFormSubmission(
      () => createContact(data),
      {
        successMessage: 'Contact created successfully',
        onSuccess: (newContact) => {
          // Reset form
          setFormData({
            firstName: '',
            lastName: '',
            relationship: '',
            email: '',
            phone: '',
            organization: '',
          });
          setErrors({});
          // Update parent component or navigate
        },
      }
    );

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        label="First Name"
        value={formData.firstName}
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        error={errors.firstName}
        required
      />
      <FormInput
        label="Last Name"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        error={errors.lastName}
        required
      />
      <FormInput
        label="Relationship"
        value={formData.relationship}
        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
        error={errors.relationship}
        required
      />
      <FormInput
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <FormInput
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />
      <FormInput
        label="Organization"
        value={formData.organization}
        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Contact'}
      </Button>
    </form>
  );
}
```

## Error Handling

All API functions return a `SupabaseResponse<T>` with `data` and `error` properties:

```typescript
const { data, error } = await createStudent(studentData);

if (error) {
  // Handle error
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Error details:', error.details);
} else {
  // Use data
  console.log('Created student:', data);
}
```

### Common Error Codes

- `AUTH_ERROR` - User not authenticated
- `UNIQUE_CONSTRAINT_ERROR` - Record already exists
- `FOREIGN_KEY_ERROR` - Cannot delete due to references
- `RLS_ERROR` - Row Level Security policy violation
- `UNKNOWN_ERROR` - Unexpected error

## Switching Between Mock and Real Data

The API layer automatically works with both mock data (via MSW) and real Supabase data. No changes needed!

- **Mock mode**: Set `VITE_USE_MOCK_DATA=true` in `.env.local`
- **Real mode**: Set `VITE_USE_MOCK_DATA=false` and configure Supabase credentials

## Best Practices

1. **Always handle errors**: Check the `error` property in responses
2. **Use form submission helper**: Use `handleFormSubmission` for consistent UX
3. **Validate before submitting**: Use `prepareFormData` to validate and sanitize
4. **Show loading states**: Disable buttons and show spinners during submission
5. **Provide user feedback**: Use toast notifications for success/error messages
6. **Optimize re-renders**: Update state efficiently after API calls
