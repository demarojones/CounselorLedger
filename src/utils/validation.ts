import { z } from 'zod';

/**
 * Validates form data against a Zod schema and returns formatted errors
 * @param schema - Zod schema to validate against
 * @param data - Form data to validate
 * @returns Object with isValid boolean and errors object
 */
export function validateFormData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): {
  isValid: boolean;
  errors: Record<string, string>;
  data?: z.infer<T>;
} {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      errors: {},
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const field = err.path.join('.');
        if (field) {
          errors[field] = err.message;
        }
      });
      return {
        isValid: false,
        errors,
      };
    }
    return {
      isValid: false,
      errors: { _form: 'Validation failed' },
    };
  }
}

/**
 * Validates a single field against a Zod schema
 * @param schema - Zod schema to validate against
 * @param fieldName - Name of the field to validate
 * @param value - Value to validate
 * @returns Error message or null if valid
 */
export function validateField<T extends z.ZodTypeAny>(
  schema: T,
  fieldName: string,
  value: unknown
): string | null {
  try {
    // Create a partial schema for single field validation
    const fieldSchema = (schema as any).shape?.[fieldName];
    if (fieldSchema) {
      fieldSchema.parse(value);
    }
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Invalid value';
    }
    return 'Validation failed';
  }
}

/**
 * Formats Zod errors into a flat object for form display
 * @param error - Zod error object
 * @returns Object with field names as keys and error messages as values
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.issues.forEach((err) => {
    const field = err.path.join('.');
    if (field) {
      errors[field] = err.message;
    }
  });
  return errors;
}
