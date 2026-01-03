/**
 * Form Submission Utilities
 *
 * Helper functions for handling form submissions and API calls.
 * Provides error handling, loading states, and user feedback.
 */

import { toast } from './toast';
import { getUserFriendlyErrorMessage, type SupabaseError } from '@/services/supabaseHelpers';
import type { SupabaseResponse } from '@/services/supabaseHelpers';

// ============================================================================
// TYPES
// ============================================================================

export interface FormSubmissionOptions {
  onSuccess?: (data: any) => void | Promise<void>;
  onError?: (error: SupabaseError) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export interface FormSubmissionResult<T> {
  success: boolean;
  data?: T;
  error?: SupabaseError;
}

// ============================================================================
// FORM SUBMISSION HANDLER
// ============================================================================

/**
 * Generic form submission handler
 * Handles API calls, error handling, and user feedback
 */
export async function handleFormSubmission<T>(
  submitFn: () => Promise<SupabaseResponse<T>>,
  options: FormSubmissionOptions = {}
): Promise<FormSubmissionResult<T>> {
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    errorMessage,
  } = options;

  try {
    const response = await submitFn();

    if (response.error) {
      const error = response.error;
      const message = errorMessage || getUserFriendlyErrorMessage(error);

      if (showErrorToast) {
        toast.error(message);
      }

      onError?.(error);

      return {
        success: false,
        error,
      };
    }

    if (showSuccessToast) {
      toast.success(successMessage);
    }

    if (onSuccess && response.data) {
      await onSuccess(response.data);
    }

    return {
      success: true,
      data: response.data || undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    if (showErrorToast) {
      toast.error(message);
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message,
      },
    };
  }
}

/**
 * Validate form data before submission
 */
export function validateFormData(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      errors[field] = `${field} is required`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize form data by trimming strings
 */
export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Combine validation and sanitization
 */
export function prepareFormData(
  data: Record<string, any>,
  requiredFields: string[] = []
): { valid: boolean; data: Record<string, any>; errors: Record<string, string> } {
  const sanitized = sanitizeFormData(data);
  const validation = validateFormData(sanitized, requiredFields);

  return {
    valid: validation.valid,
    data: sanitized,
    errors: validation.errors,
  };
}
