import { toast } from './toast';

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
    
    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
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
    
    if (message.includes('not found')) {
      return new AppError(
        ErrorCodes.NOT_FOUND,
        'The requested resource was not found.',
        error
      );
    }
    
    if (message.includes('already exists') || message.includes('duplicate')) {
      return new AppError(
        ErrorCodes.CONFLICT,
        'A record with this information already exists.',
        error
      );
    }
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
 * Handle API errors with appropriate user feedback
 */
export function handleApiError(error: any, options?: {
  showToast?: boolean;
  onAuthError?: () => void;
  onPermissionError?: () => void;
  customMessage?: string;
}): AppError {
  const {
    showToast: shouldShowToast = true,
    onAuthError,
    onPermissionError,
    customMessage,
  } = options || {};
  
  const appError = parseSupabaseError(error);
  
  // Log error in development
  if (import.meta.env.DEV) {
    console.error('API Error:', {
      code: appError.code,
      message: appError.message,
      details: appError.details,
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
  
  // Show toast notification for other errors
  if (shouldShowToast) {
    toast.error(customMessage || appError.message);
  }
  
  return appError;
}

/**
 * Wrapper for async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    errorMessage?: string;
    showToast?: boolean;
    onAuthError?: () => void;
    onPermissionError?: () => void;
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
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options || {};
  
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
