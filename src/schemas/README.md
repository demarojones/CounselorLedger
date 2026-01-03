# Validation Schemas

This directory contains all Zod validation schemas used throughout the application for form validation and data integrity.

## Overview

All forms in the application use Zod schemas for validation, providing:

- Type-safe validation
- Consistent error messages
- Runtime type checking
- Automatic TypeScript type inference

## Available Schemas

### Authentication (`auth.ts`)

**loginSchema**

- Validates user login credentials
- Fields: email (required, valid email), password (required, min 6 characters)

```typescript
import { loginSchema } from '@/schemas/auth';

const result = loginSchema.parse({ email: 'user@example.com', password: 'password123' });
```

### Contact Management (`contact.ts`)

**contactFormSchema**

- Validates contact creation and editing
- Fields:
  - firstName (required, max 50 chars)
  - lastName (required, max 50 chars)
  - relationship (required, enum)
  - email (optional, valid email format)
  - phone (optional, valid phone format)
  - organization (optional, max 100 chars)
  - notes (optional, max 1000 chars)

**contactRelationshipSchema**

- Enum: Parent, Guardian, Teacher, Administrator, Counselor, Social Worker, Other

```typescript
import { contactFormSchema } from '@/schemas/contact';

const result = contactFormSchema.parse({
  firstName: 'John',
  lastName: 'Doe',
  relationship: 'Parent',
  email: 'john@example.com',
});
```

### Student Management (`student.ts`)

**studentFormSchema**

- Validates student creation and editing
- Fields:
  - studentId (required, max 20 chars)
  - firstName (required, max 50 chars)
  - lastName (required, max 50 chars)
  - gradeLevel (required, enum)
  - email (optional, valid email format)
  - phone (optional, valid phone format)
  - needsFollowUp (boolean, default false)
  - followUpNotes (optional, max 500 chars)

**gradeLevelSchema**

- Enum: Pre-K through 12th Grade

```typescript
import { studentFormSchema } from '@/schemas/student';

const result = studentFormSchema.parse({
  studentId: 'S12345',
  firstName: 'Jane',
  lastName: 'Smith',
  gradeLevel: '10th Grade',
});
```

### User Management (`user.ts`)

**userFormSchema**

- Validates user account creation and editing
- Fields:
  - email (required, valid email, max 100 chars, lowercase)
  - firstName (required, max 50 chars)
  - lastName (required, max 50 chars)
  - role (required, enum: ADMIN or COUNSELOR)

**userRoleSchema**

- Enum: ADMIN, COUNSELOR

```typescript
import { userFormSchema } from '@/schemas/user';

const result = userFormSchema.parse({
  email: 'counselor@school.edu',
  firstName: 'Sarah',
  lastName: 'Johnson',
  role: 'COUNSELOR',
});
```

### Interaction Tracking (`interaction.ts`)

**interactionFormSchema**

- Validates interaction creation and editing
- Fields:
  - type (required, enum: student or contact)
  - studentId (required if type is student)
  - contactId (required if type is contact)
  - categoryId (required)
  - subcategoryId (optional)
  - customReason (optional, required if subcategory is "Custom")
  - startTime (required, datetime string)
  - durationMinutes (required, 1-480 minutes)
  - notes (optional)
  - needsFollowUp (boolean, default false)
  - followUpDate (required if needsFollowUp is true)
  - followUpNotes (optional)

Custom validation rules:

- Either studentId or contactId must be provided
- If needsFollowUp is true, followUpDate is required
- Duration must be between 1 and 480 minutes (8 hours)

```typescript
import { interactionFormSchema } from '@/schemas/interaction';

const result = interactionFormSchema.parse({
  type: 'student',
  studentId: 'abc-123',
  categoryId: 'def-456',
  startTime: '2024-01-15T10:00',
  durationMinutes: 30,
  needsFollowUp: false,
});
```

### Reason Categories (`reasonCategory.ts`)

**reasonCategoryFormSchema**

- Validates reason category creation and editing
- Fields:
  - name (required, max 100 chars)
  - color (optional, hex color format like #FF5733)
  - sortOrder (integer, min 0, default 0)

**reasonSubcategoryFormSchema**

- Validates reason subcategory creation and editing
- Fields:
  - categoryId (required, UUID)
  - name (required, max 100 chars)
  - sortOrder (integer, min 0, default 0)

```typescript
import { reasonCategoryFormSchema } from '@/schemas/reasonCategory';

const result = reasonCategoryFormSchema.parse({
  name: 'Academic Support',
  color: '#3B82F6',
  sortOrder: 1,
});
```

### Report Filters (`report.ts`)

**reportFiltersSchema**

- Validates report filter parameters
- Fields:
  - startDate (required, Date object)
  - endDate (required, Date object)
  - gradeLevel (optional, string)
  - categoryId (optional, UUID)
  - counselorId (optional, UUID)

Custom validation rules:

- endDate must be after or equal to startDate
- startDate cannot be in the future

**dateRangePresetSchema**

- Enum: last7days, last30days, last90days, lastYear, custom

```typescript
import { reportFiltersSchema } from '@/schemas/report';

const result = reportFiltersSchema.parse({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  gradeLevel: '10th Grade',
});
```

## Usage in Components

### Basic Form Validation

```typescript
import { contactFormSchema } from '@/schemas/contact';
import { z } from 'zod';

const validateForm = (): boolean => {
  try {
    contactFormSchema.parse(formData);
    setErrors({});
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const newErrors: Record<string, string> = {};
      error.issues.forEach(err => {
        const field = err.path[0] as string;
        if (field) {
          newErrors[field] = err.message;
        }
      });
      setErrors(newErrors);
    }
    return false;
  }
};
```

### Using Validation Utilities

```typescript
import { validateFormData } from '@/utils/validation';
import { userFormSchema } from '@/schemas/user';

const { isValid, errors, data } = validateFormData(userFormSchema, formData);

if (isValid) {
  // data is now typed and validated
  await submitForm(data);
} else {
  // errors contains field-level error messages
  setFormErrors(errors);
}
```

## Type Inference

All schemas automatically generate TypeScript types:

```typescript
import type { ContactFormSchema } from '@/schemas/contact';
import type { InteractionFormSchema } from '@/schemas/interaction';
import type { UserFormSchema } from '@/schemas/user';

// These types are inferred from the Zod schemas
const contact: ContactFormSchema = {
  firstName: 'John',
  lastName: 'Doe',
  relationship: 'Parent',
};
```

## Validation Utilities

See `src/utils/validation.ts` for helper functions:

- `validateFormData()` - Validates data and returns formatted errors
- `validateField()` - Validates a single field
- `formatZodErrors()` - Formats Zod errors into a flat object

## Best Practices

1. **Always validate on submit**: Run validation before submitting forms
2. **Clear errors on change**: Clear field errors when user starts typing
3. **Show inline errors**: Display validation errors next to form fields
4. **Use type inference**: Let TypeScript infer types from schemas
5. **Consistent error messages**: Use schema-defined messages for consistency
6. **Test edge cases**: Ensure validation handles empty strings, null, undefined

## Adding New Schemas

When adding a new schema:

1. Create the schema file in `src/schemas/`
2. Export the schema and its inferred type
3. Add the export to `src/schemas/index.ts`
4. Update this README with documentation
5. Use the schema in relevant form components

Example:

```typescript
// src/schemas/newFeature.ts
import { z } from 'zod';

export const newFeatureSchema = z.object({
  field1: z.string().min(1, 'Field 1 is required'),
  field2: z.number().min(0, 'Field 2 must be positive'),
});

export type NewFeatureSchema = z.infer<typeof newFeatureSchema>;
```

```typescript
// src/schemas/index.ts
export * from './newFeature';
```
