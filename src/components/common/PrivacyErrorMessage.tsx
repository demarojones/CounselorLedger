/**
 * Privacy Error Message Component
 *
 * Displays user-friendly error messages for privacy violations
 * without exposing sensitive information.
 */

import React from 'react';
import { AlertTriangle, Shield, Lock } from 'lucide-react';
import { ErrorCodes } from '@/utils/errorHandling';

interface PrivacyErrorMessageProps {
  errorCode?: string;
  message?: string;
  className?: string;
  showIcon?: boolean;
}

export function PrivacyErrorMessage({
  errorCode,
  message,
  className = '',
  showIcon = true,
}: PrivacyErrorMessageProps) {
  const getErrorContent = () => {
    switch (errorCode) {
      case ErrorCodes.PRIVACY_VIOLATION:
      case ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED:
        return {
          icon: <Shield className="h-5 w-5 text-amber-500" />,
          title: 'Access Restricted',
          description:
            'You can only access your own interaction records. This helps maintain counselor privacy and confidentiality.',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
        };

      case ErrorCodes.UNAUTHORIZED_INTERACTION_ACCESS:
        return {
          icon: <Lock className="h-5 w-5 text-red-500" />,
          title: 'Unauthorized Access',
          description:
            'You do not have permission to access this interaction. Please contact your administrator if you believe this is an error.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
        };

      case ErrorCodes.INTERACTION_NOT_FOUND:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-gray-500" />,
          title: 'Interaction Not Found',
          description:
            'The requested interaction was not found or you do not have permission to access it.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
        };

      case ErrorCodes.BULK_ACCESS_VIOLATION:
        return {
          icon: <Shield className="h-5 w-5 text-amber-500" />,
          title: 'Bulk Operation Restricted',
          description:
            'Some interactions in this operation belong to other counselors and cannot be accessed. Only your own interactions can be modified.',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
        };

      case ErrorCodes.TENANT_ACCESS_DENIED:
        return {
          icon: <Lock className="h-5 w-5 text-red-500" />,
          title: 'Organization Access Denied',
          description: 'This resource belongs to a different organization and cannot be accessed.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
        };

      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-gray-500" />,
          title: 'Access Error',
          description:
            message || 'An access control error occurred. Please try again or contact support.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
        };
    }
  };

  const { icon, title, description, bgColor, borderColor, textColor } = getErrorContent();

  return (
    <div className={`rounded-lg border p-4 ${bgColor} ${borderColor} ${className}`}>
      <div className="flex items-start space-x-3">
        {showIcon && <div className="flex-shrink-0">{icon}</div>}
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
          <p className={`mt-1 text-sm ${textColor} opacity-90`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to determine if an error is privacy-related
 */
export function useIsPrivacyError(errorCode?: string): boolean {
  const privacyErrorCodes = [
    ErrorCodes.PRIVACY_VIOLATION,
    ErrorCodes.UNAUTHORIZED_INTERACTION_ACCESS,
    ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED,
    ErrorCodes.INTERACTION_NOT_FOUND,
    ErrorCodes.BULK_ACCESS_VIOLATION,
    ErrorCodes.TENANT_ACCESS_DENIED,
  ];

  return errorCode ? privacyErrorCodes.includes(errorCode as typeof privacyErrorCodes[number]) : false;
}

/**
 * Privacy-aware error boundary for interaction components
 */
interface PrivacyErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface PrivacyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PrivacyErrorBoundary extends React.Component<
  PrivacyErrorBoundaryProps,
  PrivacyErrorBoundaryState
> {
  constructor(props: PrivacyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PrivacyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error without exposing sensitive information
    console.error('Privacy error boundary caught an error:', {
      message: error.message,
      name: error.name,
      // Don't log the full stack trace or error info in production
      ...(import.meta.env.DEV && { stack: error.stack, errorInfo }),
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} />;
      }

      return (
        <PrivacyErrorMessage
          errorCode={ErrorCodes.SERVER_ERROR}
          message="An error occurred while loading this content. Please refresh the page or contact support if the problem persists."
          className="m-4"
        />
      );
    }

    return this.props.children;
  }
}
