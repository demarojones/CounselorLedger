# Utility Functions Documentation

This document provides detailed information about utility functions used throughout the School Counselor Ledger application.

## Table of Contents

- [Date Helpers](#date-helpers)
- [Name Helpers](#name-helpers)
- [Validation Helpers](#validation-helpers)
- [Error Handling](#error-handling)
- [Export Helpers](#export-helpers)

---

## Date Helpers

**Location:** `src/utils/dateHelpers.ts`

Utility functions for formatting, parsing, and manipulating dates and times.

### formatDate

Format a date for display in various formats.

```typescript
formatDate(date: Date | string, format?: 'short' | 'long' | 'full'): string
```

**Parameters:**
- `date` - Date object or ISO string
- `format` - Format style (default: 'short')
  - `'short'` - MM/DD/YYYY
  - `'long'` - January 1, 2024
  - `'full'` - Monday, January 1, 2024

**Examples:**

```typescript
formatDate(new Date(), 'short')  // "01/15/2024"
formatDate(new Date(), 'long')   // "January 15, 2024"
formatDate(new Date(), 'full')   // "Monday, January 15, 2024"
```

---

### formatTime

Format a time for display in 12-hour format.

```typescript
formatTime(date: Date | string, includeSeconds?: boolean): string
```

**Parameters:**
- `date` - Date object or ISO string
- `includeSeconds` - Whether to include seconds (default: false)

**Examples:**

```typescript
formatTime(new Date())        // "2:30 PM"
formatTime(new Date(), true)  // "2:30:45 PM"
```

---

### formatDateTime

Format a date and time together for display.

```typescript
formatDateTime(date: Date | string, format?: 'short' | 'long'): string
```

**Examples:**

```typescript
formatDateTime(new Date(), 'short')  // "01/15/2024, 2:30 PM"
formatDateTime(new Date(), 'long')   // "January 15, 2024 at 2:30 PM"
```

---

### formatDuration

Format a duration in minutes to a human-readable string.

```typescript
formatDuration(minutes: number): string
```

**Examples:**

```typescript
formatDuration(30)   // "30 min"
formatDuration(90)   // "1 hr 30 min"
formatDuration(120)  // "2 hrs"
```

---

### calculateEndTime

Calculate end time from start time and duration.

```typescript
calculateEndTime(startTime: Date | string, durationMinutes: number): Date
```

**Example:**

```typescript
const start = new Date('2024-01-15T14:00:00');
const end = calculateEndTime(start, 30);
// Returns Date object for 2:30 PM
```

---

### calculateDuration

Calculate duration in minutes between two dates.

```typescript
calculateDuration(startTime: Date | string, endTime: Date | string): number
```

**Example:**

```typescript
const start = new Date('2024-01-15T14:00:00');
const end = new Date('2024-01-15T15:30:00');
calculateDuration(start, end)  // 90
```

---

### getRelativeTime

Get relative time string from now (e.g., "2 hours ago", "in 3 days").

```typescript
getRelativeTime(date: Date | string): string
```

**Examples:**

```typescript
getRelativeTime(new Date(Date.now() - 3600000))   // "1 hour ago"
getRelativeTime(new Date(Date.now() + 86400000))  // "in 1 day"
getRelativeTime(new Date(Date.now() - 60000))     // "1 minute ago"
```

---

### isToday / isPast / isFuture

Check if a date is today, in the past, or in the future.

```typescript
isToday(date: Date | string): boolean
isPast(date: Date | string): boolean
isFuture(date: Date | string): boolean
```

**Examples:**

```typescript
isToday(new Date())                      // true
isPast(new Date('2020-01-01'))          // true
isFuture(new Date('2030-01-01'))        // true
```

---

### startOfDay / endOfDay

Get start or end of day for a date.

```typescript
startOfDay(date: Date | string): Date  // 00:00:00.000
endOfDay(date: Date | string): Date    // 23:59:59.999
```

**Examples:**

```typescript
startOfDay(new Date('2024-01-15T14:30:00'))  // 2024-01-15T00:00:00.000
endOfDay(new Date('2024-01-15T14:30:00'))    // 2024-01-15T23:59:59.999
```

---

### addDays / addMonths

Add or subtract days/months from a date.

```typescript
addDays(date: Date | string, days: number): Date
addMonths(date: Date | string, months: number): Date
```

**Examples:**

```typescript
addDays(new Date('2024-01-15'), 7)    // 2024-01-22
addDays(new Date('2024-01-15'), -3)   // 2024-01-12
addMonths(new Date('2024-01-15'), 3)  // 2024-04-15
```

---

### formatDateForInput / formatTimeForInput / formatDateTimeForInput

Format dates for HTML input fields.

```typescript
formatDateForInput(date: Date | string): string        // YYYY-MM-DD
formatTimeForInput(date: Date | string): string        // HH:MM
formatDateTimeForInput(date: Date | string): string    // YYYY-MM-DDTHH:MM
```

**Examples:**

```typescript
formatDateForInput(new Date('2024-01-15'))      // "2024-01-15"
formatTimeForInput(new Date('2024-01-15T14:30')) // "14:30"
formatDateTimeForInput(new Date())               // "2024-01-15T14:30"
```

---

### parseDateRange

Parse date range string into start and end dates.

```typescript
parseDateRange(range: string): { startDate: Date; endDate: Date }
```

**Supported ranges:**
- "today"
- "yesterday"
- "last 7 days"
- "last 30 days"
- "last 90 days"
- "this month"
- "last month"
- "this year"

**Example:**

```typescript
const { startDate, endDate } = parseDateRange('last 7 days');
```

---

## Name Helpers

**Location:** `src/utils/nameHelpers.ts`

Utility functions for formatting and manipulating person names.

### formatFullName

Format a full name from first, last, and optional middle name.

```typescript
formatFullName(firstName: string, lastName: string, middleName?: string): string
```

**Examples:**

```typescript
formatFullName('John', 'Doe')                    // "John Doe"
formatFullName('John', 'Doe', 'Michael')         // "John Michael Doe"
formatFullName('', '')                           // "Unknown"
```

---

### formatLastFirst

Format name in "Last, First" format (useful for alphabetical sorting).

```typescript
formatLastFirst(firstName: string, lastName: string): string
```

**Example:**

```typescript
formatLastFirst('John', 'Doe')  // "Doe, John"
```

---

### getInitials

Get initials from a name.

```typescript
getInitials(firstName: string, lastName: string, middleName?: string): string
```

**Examples:**

```typescript
getInitials('John', 'Doe')                  // "JD"
getInitials('John', 'Doe', 'Michael')       // "JMD"
```

---

### formatInitialLastName

Get first name initial and full last name.

```typescript
formatInitialLastName(firstName: string, lastName: string): string
```

**Example:**

```typescript
formatInitialLastName('John', 'Doe')  // "J. Doe"
```

---

### capitalizeWords

Capitalize first letter of each word in a string.

```typescript
capitalizeWords(text: string): string
```

**Examples:**

```typescript
capitalizeWords('john doe')    // "John Doe"
capitalizeWords('JOHN DOE')    // "John Doe"
```

---

### formatProperName

Format name with proper capitalization, handling special cases.

```typescript
formatProperName(name: string): string
```

**Handles special cases:**
- McDonald → McDonald
- O'Brien → O'Brien
- MacLeod → MacLeod

**Examples:**

```typescript
formatProperName('mcdonald')   // "McDonald"
formatProperName("o'brien")    // "O'Brien"
formatProperName('macleod')    // "MacLeod"
```

---

### getDisplayName

Get display name with fallback options.

```typescript
getDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
  fallback?: string
): string
```

**Tries in order:**
1. Full name (first + last)
2. First name only
3. Last name only
4. Email username
5. Fallback text

**Examples:**

```typescript
getDisplayName('John', 'Doe')                    // "John Doe"
getDisplayName(null, null, 'john@example.com')   // "john"
getDisplayName(null, null, null)                 // "Unknown User"
getDisplayName(null, null, null, 'Guest')        // "Guest"
```

---

### parseFullName

Parse full name string into first and last name components.

```typescript
parseFullName(fullName: string): { firstName: string; lastName: string }
```

**Examples:**

```typescript
parseFullName('John Doe')           // { firstName: 'John', lastName: 'Doe' }
parseFullName('John Michael Doe')   // { firstName: 'John', lastName: 'Michael Doe' }
```

---

### truncateName

Truncate name to fit within a character limit.

```typescript
truncateName(firstName: string, lastName: string, maxLength: number): string
```

**Tries in order:**
1. Full name
2. Initial + last name
3. Initials
4. Truncate with ellipsis

**Examples:**

```typescript
truncateName('John', 'Doe', 20)   // "John Doe"
truncateName('John', 'Doe', 8)    // "J. Doe"
truncateName('John', 'Doe', 3)    // "JD"
```

---

### compareNames

Compare function for sorting names alphabetically.

```typescript
compareNames(
  a: { firstName: string; lastName: string },
  b: { firstName: string; lastName: string }
): number
```

**Example:**

```typescript
const people = [
  { firstName: 'John', lastName: 'Doe' },
  { firstName: 'Jane', lastName: 'Smith' }
];
people.sort(compareNames);  // Sorted by last name, then first name
```

---

## Validation Helpers

**Location:** `src/utils/validation.ts`

Utility functions for form validation using Zod schemas.

### validateFormData

Validates form data against a Zod schema and returns formatted errors.

```typescript
validateFormData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): {
  isValid: boolean;
  errors: Record<string, string>;
  data?: z.infer<T>;
}
```

**Example:**

```typescript
import { z } from 'zod';
import { validateFormData } from '@/utils/validation';

const schema = z.object({
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older')
});

const result = validateFormData(schema, {
  email: 'invalid',
  age: 15
});

if (!result.isValid) {
  console.log(result.errors);
  // { email: 'Invalid email', age: 'Must be 18 or older' }
}
```

---

### validateField

Validates a single field against a Zod schema.

```typescript
validateField<T extends z.ZodTypeAny>(
  schema: T,
  fieldName: string,
  value: unknown
): string | null
```

**Example:**

```typescript
const error = validateField(schema, 'email', 'invalid-email');
if (error) {
  console.log(error);  // "Invalid email"
}
```

---

### formatZodErrors

Formats Zod errors into a flat object for form display.

```typescript
formatZodErrors(error: z.ZodError): Record<string, string>
```

**Example:**

```typescript
try {
  schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errors = formatZodErrors(error);
    setFormErrors(errors);
  }
}
```

---

## Error Handling

**Location:** `src/utils/errorHandling.ts`

Utility functions for handling and formatting API errors.

### handleApiError

Processes API errors and returns a formatted error object.

```typescript
handleApiError(
  error: unknown,
  options?: { customMessage?: string }
): { message: string; code?: string }
```

**Example:**

```typescript
import { handleApiError } from '@/utils/errorHandling';

try {
  await supabase.from('students').insert(data);
} catch (error) {
  const apiError = handleApiError(error, {
    customMessage: 'Failed to create student'
  });
  toast.error(apiError.message);
}
```

---

## Export Helpers

**Location:** `src/utils/exportHelpers.ts`

Utility functions for exporting data to various formats.

### exportToCSV

Export data to CSV format.

```typescript
exportToCSV(data: any[], filename: string): void
```

**Example:**

```typescript
import { exportToCSV } from '@/utils/exportHelpers';

const students = [
  { id: '1', name: 'John Doe', grade: '10' },
  { id: '2', name: 'Jane Smith', grade: '11' }
];

exportToCSV(students, 'students.csv');
```

---

### exportToPDF

Export data to PDF format (with charts and tables).

```typescript
exportToPDF(elementId: string, filename: string): Promise<void>
```

**Example:**

```typescript
import { exportToPDF } from '@/utils/exportHelpers';

// Export a specific element to PDF
await exportToPDF('report-container', 'monthly-report.pdf');
```

---

## Best Practices

### Date Handling

1. **Always use ISO strings for storage:**
   ```typescript
   const isoString = new Date().toISOString();
   ```

2. **Format dates for display:**
   ```typescript
   const displayDate = formatDate(isoString, 'long');
   ```

3. **Use formatDateForInput for form inputs:**
   ```typescript
   <input
     type="date"
     value={formatDateForInput(date)}
     onChange={(e) => setDate(e.target.value)}
   />
   ```

### Name Formatting

1. **Always handle null/undefined:**
   ```typescript
   const name = getDisplayName(firstName, lastName, email, 'Unknown');
   ```

2. **Use formatProperName for user input:**
   ```typescript
   const properName = formatProperName(userInput);
   ```

3. **Sort by last name:**
   ```typescript
   students.sort(compareNames);
   ```

### Validation

1. **Define schemas once, reuse everywhere:**
   ```typescript
   // schemas/student.ts
   export const studentSchema = z.object({
     firstName: z.string().min(1),
     lastName: z.string().min(1),
     gradeLevel: z.string()
   });
   ```

2. **Validate before submission:**
   ```typescript
   const result = validateFormData(studentSchema, formData);
   if (!result.isValid) {
     setErrors(result.errors);
     return;
   }
   ```

3. **Clear errors on field change:**
   ```typescript
   onChange={(e) => {
     setValue(e.target.value);
     setErrors(prev => ({ ...prev, fieldName: '' }));
   }}
   ```

---

## Additional Resources

- [Component Documentation](./COMPONENTS.md)
- [Hooks Documentation](./HOOKS.md)
- [API Integration](./API.md)
- [Zod Documentation](https://zod.dev/)
