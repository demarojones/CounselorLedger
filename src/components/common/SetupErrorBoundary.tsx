/**
 * Setup Error Boundary
 *
 * Specialized error boundary for setup and invitation flows with
 * enhanced error reporting and user-friendly recovery options.
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { logSecurityEvent } from '@/services/securityEventService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: 'setup' | 'invitation' | 'general';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class SetupErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}`;

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('SetupErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
      console.error('Error ID:', errorId);
    }

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log security event for setup/invitation errors
    try {
      await logSecurityEvent({
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        details: {
          errorType: 'component_error',
          context: this.props.context || 'general',
          errorMessage: error.message,
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (loggingError) {
      console.error('Failed to log error event:', loggingError);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you could send this to an error reporting service
    // Example: Sentry.captureException(error, {
    //   extra: { ...errorInfo, errorId, context: this.props.context }
    // });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getContextualMessage = () => {
    switch (this.props.context) {
      case 'setup':
        return {
          title: 'Setup Error',
          message:
            'There was an error during the initial setup process. This might be due to an invalid setup token or a temporary system issue.',
          suggestions: [
            'Check if your setup link is still valid',
            'Try refreshing the page',
            'Contact your system administrator if the problem persists',
          ],
        };
      case 'invitation':
        return {
          title: 'Invitation Error',
          message:
            'There was an error processing your invitation. This might be due to an expired invitation or a temporary system issue.',
          suggestions: [
            'Check if your invitation link is still valid',
            'Try refreshing the page',
            'Request a new invitation from your administrator',
          ],
        };
      default:
        return {
          title: 'Application Error',
          message: 'Something unexpected happened. We apologize for the inconvenience.',
          suggestions: [
            'Try refreshing the page',
            'Check your internet connection',
            'Contact support if the problem persists',
          ],
        };
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const contextualInfo = this.getContextualMessage();

      // Enhanced error UI with context-specific messaging
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-lg w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{contextualInfo.title}</h2>

              <p className="text-gray-600 mb-4">{contextualInfo.message}</p>

              <div className="text-left mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">What you can try:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {contextualInfo.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {this.state.errorId && (
                <div className="mb-6 p-3 bg-gray-100 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>Error ID:</strong> {this.state.errorId}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Please include this ID when contacting support.
                  </p>
                </div>
              )}

              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 text-left">
                  <details className="bg-gray-100 rounded-lg p-4">
                    <summary className="cursor-pointer font-medium text-sm text-gray-700 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="text-xs text-gray-600 space-y-2">
                      <div>
                        <strong>Error:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-words">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div className="space-y-3">
                <Button onClick={this.handleRetry} className="w-full">
                  Try Again
                </Button>
                <div className="flex space-x-3">
                  <Button onClick={this.handleReload} variant="outline" className="flex-1">
                    Reload Page
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                    Go Home
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SetupErrorBoundary;
