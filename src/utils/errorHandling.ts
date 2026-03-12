import { toast } from './toast';
import { logSecurityEvent, logAuthFailure } from '@/services/securityEventService';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export class AppError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

// Error codes
export const ErrorCodes = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',

  // Tenant errors
  TENANT_NOT_FOUND: 'TENANT_001',
  TENANT_ACCESS_DENIED: 'TENANT_002',

  // Privacy and access control errors
  PRIVACY_VIOLATION: 'PRIVACY_001',
  UNAUTHORIZED_INTERACTION_ACCESS: 'PRIVACY_002',
  CROSS_COUNSELOR_ACCESS_DENIED: 'PRIVACY_003',
  INTERACTION_NOT_FOUND: 'PRIVACY_004',
  BULK_ACCESS_VIOLATION: 'PRIVACY_005',

  // Setup and invitation errors
  SETUP_TOKEN_INVALID: 'SETUP_001',
  SETUP_TOKEN_EXPIRED: 'SETUP_002',
  SETUP_TOKEN_USED: 'SETUP_003',
  INVITATION_TOKEN_INVALID: 'INVITATION_001',
  INVITATION_TOKEN_EXPIRED: 'INVITATION_002',
  INVITATION_TOKEN_USED: 'INVITATION_003',
  INVITATION_EMAIL_EXISTS: 'INVITATION_004',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_001',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND_001',
  CONFLICT: 'CONFLICT_001',

  // Server errors
  SERVER_ERROR: 'SERVER_001',
  NETWORK_ERROR: 'NETWORK_001',
} as const;

/**
 * Parse Supabase error into a user-friendly message
 */
export function parseSupabaseError(error: any): AppError {
  // Handle Supabase auth errors
  if (error?.message) {
    const message = error.message.toLowerCase();

    if (
      message.includes('invalid login credentials') ||
      message.includes('invalid email or password')
    ) {
      return new AppError(
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password. Please try again.',
        error
      );
    }

    if (message.includes('jwt expired') || message.includes('token expired')) {
      return new AppError(
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Your session has expired. Please log in again.',
        error
      );
    }

    if (message.includes('permission denied') || message.includes('insufficient permissions')) {
      return new AppError(
        ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
        'You do not have permission to perform this action.',
        error
      );
    }

    // Privacy violation errors
    if (message.includes('privacy_violation') || message.includes('cross_counselor_access')) {
      return new AppError(
        ErrorCodes.PRIVACY_VIOLATION,
        'Access denied. You can only access your own interaction records.',
        error
      );
    }

    if (message.includes('unauthorized_interaction_access')) {
      return new AppError(
        ErrorCodes.UNAUTHORIZED_INTERACTION_ACCESS,
        'You do not have permission to access this interaction.',
        error
      );
    }

    if (message.includes('interaction belongs to another counselor')) {
      return new AppError(
        ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED,
        'This interaction belongs to another counselor and cannot be accessed.',
        error
      );
    }

    if (message.includes('interaction belongs to different tenant')) {
      return new AppError(
        ErrorCodes.TENANT_ACCESS_DENIED,
        'Access denied. This resource belongs to a different organization.',
        error
      );
    }

    // Setup and invitation specific errors
    if (message.includes('setup token') && message.includes('invalid')) {
      return new AppError(
        ErrorCodes.SETUP_TOKEN_INVALID,
        'The setup link is invalid or has been tampered with.',
        error
      );
    }

    if (message.includes('setup token') && message.includes('expired')) {
      return new AppError(
        ErrorCodes.SETUP_TOKEN_EXPIRED,
        'The setup link has expired. Please request a new one.',
        error
      );
    }

    if (message.includes('invitation') && message.includes('invalid')) {
      return new AppError(
        ErrorCodes.INVITATION_TOKEN_INVALID,
        'The invitation link is invalid or has been tampered with.',
        error
      );
    }

    if (message.includes('invitation') && message.includes('expired')) {
      return new AppError(
        ErrorCodes.INVITATION_TOKEN_EXPIRED,
        'The invitation has expired. Please request a new one.',
        error
      );
    }

    if (message.includes('email already exists') || message.includes('user already exists')) {
      return new AppError(
        ErrorCodes.INVITATION_EMAIL_EXISTS,
        'A user with this email address already exists.',
        error
      );
    }

    if (message.includes('not found')) {
      return new AppError(ErrorCodes.NOT_FOUND, 'The requested resource was not found.', error);
    }

    if (message.includes('already exists') || message.includes('duplicate')) {
      return new AppError(
        ErrorCodes.CONFLICT,
        'A record with this information already exists.',
        error
      );
    }
  }

  // Handle privacy-specific error codes directly
  if (error?.code === 'PRIVACY_VIOLATION') {
    return new AppError(
      ErrorCodes.PRIVACY_VIOLATION,
      'Access denied. You can only access your own interaction records.',
      error
    );
  }

  if (error?.code === 'UNAUTHORIZED_INTERACTION_ACCESS') {
    return new AppError(
      ErrorCodes.UNAUTHORIZED_INTERACTION_ACCESS,
      'You do not have permission to access this interaction.',
      error
    );
  }

  if (error?.code === 'CROSS_COUNSELOR_ACCESS_DENIED') {
    return new AppError(
      ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED,
      'This interaction belongs to another counselor and cannot be accessed.',
      error
    );
  }

  if (error?.code === 'INTERACTION_NOT_FOUND') {
    return new AppError(
      ErrorCodes.INTERACTION_NOT_FOUND,
      'The requested interaction was not found or you do not have permission to access it.',
      error
    );
  }

  if (error?.code === 'BULK_ACCESS_VIOLATION') {
    return new AppError(
      ErrorCodes.BULK_ACCESS_VIOLATION,
      'Access denied to one or more interactions in the bulk operation.',
      error
    );
  }

  // Handle network errors
  if (error?.name === 'NetworkError' || !navigator.onLine) {
    return new AppError(
      ErrorCodes.NETWORK_ERROR,
      'Network error. Please check your internet connection.',
      error
    );
  }

  // Default server error
  return new AppError(
    ErrorCodes.SERVER_ERROR,
    error?.message || 'An unexpected error occurred. Please try again.',
    error
  );
}

/**
 * Handle API errors with appropriate user feedback and security logging
 */
export function handleApiError(
  error: any,
  options?: {
    showToast?: boolean;
    onAuthError?: () => void;
    onPermissionError?: () => void;
    onPrivacyViolation?: () => void;
    customMessage?: string;
    context?: string;
    email?: string;
    interactionId?: string;
    operation?: string;
  }
): AppError {
  const {
    showToast: shouldShowToast = true,
    onAuthError,
    onPermissionError,
    onPrivacyViolation,
    customMessage,
    context,
    email,
    interactionId,
    operation,
  } = options || {};

  const appError = parseSupabaseError(error);

  // Log error in development
  if (import.meta.env.DEV) {
    console.error('API Error:', {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      context,
    });
  }

  // Log security events for authentication and permission errors
  if (
    appError.code === ErrorCodes.AUTH_TOKEN_EXPIRED ||
    appError.code === ErrorCodes.AUTH_INVALID_CREDENTIALS
  ) {
    logAuthFailure(email, {
      errorCode: appError.code,
      errorMessage: appError.message,
      context: context || 'api_call',
      timestamp: new Date().toISOString(),
    }).catch(loggingError => {
      console.error('Failed to log auth failure:', loggingError);
    });
  }

  // Log privacy violation attempts
  if (
    appError.code === ErrorCodes.PRIVACY_VIOLATION ||
    appError.code === ErrorCodes.UNAUTHORIZED_INTERACTION_ACCESS ||
    appError.code === ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED ||
    appError.code === ErrorCodes.BULK_ACCESS_VIOLATION
  ) {
    logSecurityEvent({
      eventType: 'PRIVACY_VIOLATION_ATTEMPT',
      severity: 'HIGH',
      email,
      details: {
        errorCode: appError.code,
        errorMessage: 'Privacy boundary violation attempted',
        context: context || 'interaction_access',
        operation: operation || 'unknown',
        interactionId: interactionId || 'unknown',
        timestamp: new Date().toISOString(),
        // Note: We don't log the actual error details to avoid exposing sensitive information
      },
    }).catch(loggingError => {
      console.error('Failed to log privacy violation:', loggingError);
    });

    if (onPrivacyViolation) {
      onPrivacyViolation();
    }
  }

  // Log suspicious activity for repeated permission errors
  if (appError.code === ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS) {
    logSecurityEvent({
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      email,
      details: {
        errorCode: appError.code,
        errorMessage: appError.message,
        context: context || 'permission_denied',
        timestamp: new Date().toISOString(),
      },
    }).catch(loggingError => {
      console.error('Failed to log permission error:', loggingError);
    });
  }

  // Handle authentication errors
  if (appError.code === ErrorCodes.AUTH_TOKEN_EXPIRED) {
    if (shouldShowToast) {
      toast.error('Your session has expired. Please log in again.');
    }
    if (onAuthError) {
      onAuthError();
    }
    return appError;
  }

  // Handle permission errors
  if (appError.code === ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS) {
    if (shouldShowToast) {
      toast.error('You do not have permission to perform this action.');
    }
    if (onPermissionError) {
      onPermissionError();
    }
    return appError;
  }

  // Handle privacy violations with generic messages
  if (
    appError.code === ErrorCodes.PRIVACY_VIOLATION ||
    appError.code === ErrorCodes.UNAUTHORIZED_INTERACTION_ACCESS ||
    appError.code === ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED ||
    appError.code === ErrorCodes.BULK_ACCESS_VIOLATION
  ) {
    if (shouldShowToast) {
      toast.error('Access denied. You can only access your own interaction records.');
    }
    return appError;
  }

  // Show toast notification for other errors
  if (shouldShowToast) {
    toast.error(customMessage || appError.message);
  }

  return appError;
}

/**
 * Wrapper for async operations with error handling and security logging
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    errorMessage?: string;
    showToast?: boolean;
    onAuthError?: () => void;
    onPermissionError?: () => void;
    context?: string;
    email?: string;
  }
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const appError = handleApiError(error, {
      ...options,
      customMessage: options?.errorMessage,
    });
    return { data: null, error: appError };
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  }
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, onRetry } = options || {};

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on auth or permission errors
      const appError = parseSupabaseError(error);
      if (
        appError.code === ErrorCodes.AUTH_INVALID_CREDENTIALS ||
        appError.code === ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS ||
        appError.code === ErrorCodes.VALIDATION_ERROR
      ) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Helper function to log suspicious activity patterns
 */
export async function logSuspiciousActivity(details: Record<string, any>): Promise<void> {
  await logSecurityEvent({
    eventType: 'SUSPICIOUS_ACTIVITY',
    severity: 'HIGH',
    details,
  });
}

/**
 * Create a privacy violation error with security logging
 */
export function createPrivacyViolationError(
  interactionId?: string,
  operation?: string,
  context?: string
): AppError {
  // Log the privacy violation attempt (without sensitive details)
  logSecurityEvent({
    eventType: 'PRIVACY_VIOLATION_ATTEMPT',
    severity: 'HIGH',
    details: {
      operation: operation || 'unknown',
      context: context || 'interaction_access',
      interactionId: interactionId || 'unknown',
      timestamp: new Date().toISOString(),
      // Intentionally not logging specific error details to prevent information leakage
    },
  }).catch(error => {
    console.error('Failed to log privacy violation:', error);
  });

  return new AppError(
    ErrorCodes.PRIVACY_VIOLATION,
    'Access denied. You can only access your own interaction records.',
    { interactionId, operation, context }
  );
}

/**
 * Create an unauthorized interaction access error with security logging
 */
export function createUnauthorizedAccessError(
  interactionId?: string,
  operation?: string,
  _denialReason?: string
): AppError {
  // Log the unauthorized access attempt
  logSecurityEvent({
    eventType: 'UNAUTHORIZED_INTERACTION_ACCESS',
    severity: 'HIGH',
    details: {
      operation: operation || 'unknown',
      interactionId: interactionId || 'unknown',
      denialReason: 'Access control violation',
      timestamp: new Date().toISOString(),
    },
  }).catch(error => {
    console.error('Failed to log unauthorized access:', error);
  });

  return new AppError(
    ErrorCodes.UNAUTHORIZED_INTERACTION_ACCESS,
    'You do not have permission to access this interaction.',
    { interactionId, operation }
  );
}

/**
 * Create a cross-counselor access denied error with security logging
 */
export function createCrossCounselorAccessError(
  interactionId?: string,
  operation?: string
): AppError {
  // Log the cross-counselor access attempt
  logSecurityEvent({
    eventType: 'CROSS_COUNSELOR_ACCESS_DENIED',
    severity: 'HIGH',
    details: {
      operation: operation || 'unknown',
      interactionId: interactionId || 'unknown',
      violationType: 'cross_counselor_access',
      timestamp: new Date().toISOString(),
    },
  }).catch(error => {
    console.error('Failed to log cross-counselor access attempt:', error);
  });

  return new AppError(
    ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED,
    'This interaction belongs to another counselor and cannot be accessed.',
    { interactionId, operation }
  );
}

/**
 * Create a bulk access violation error with security logging
 */
export function createBulkAccessViolationError(
  interactionIds: string[],
  operation?: string,
  invalidIds?: string[]
): AppError {
  // Log the bulk access violation
  logSecurityEvent({
    eventType: 'PRIVACY_VIOLATION_ATTEMPT',
    severity: 'HIGH',
    details: {
      operation: operation || 'bulk_operation',
      violationType: 'bulk_access_violation',
      totalInteractions: interactionIds.length,
      invalidInteractionCount: invalidIds?.length || 0,
      timestamp: new Date().toISOString(),
      // Not logging specific IDs to prevent information leakage
    },
  }).catch(error => {
    console.error('Failed to log bulk access violation:', error);
  });

  return new AppError(
    ErrorCodes.BULK_ACCESS_VIOLATION,
    'Access denied to one or more interactions in the bulk operation.',
    { interactionIds, operation, invalidIds }
  );
}
