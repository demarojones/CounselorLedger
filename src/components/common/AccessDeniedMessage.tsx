import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AccessDeniedMessageProps {
  type: 'interaction' | 'student' | 'contact' | 'report';
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export function AccessDeniedMessage({
  type,
  message,
  onRetry,
  onGoBack,
}: AccessDeniedMessageProps) {
  const getDefaultMessage = () => {
    switch (type) {
      case 'interaction':
        return 'You do not have permission to view this interaction. Interactions are private to the counselor who created them.';
      case 'student':
        return "You do not have permission to view this student's private interaction data.";
      case 'contact':
        return "You do not have permission to view this contact's private interaction data.";
      case 'report':
        return 'You do not have permission to access this report data.';
      default:
        return 'You do not have permission to access this resource.';
    }
  };

  const getIcon = () => {
    return (
      <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10m2 5a9 9 0 110-18 9 9 0 010 18z"
        />
      </svg>
    );
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">{getIcon()}</div>

          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>

          <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">
            {message || getDefaultMessage()}
          </p>

          <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-red-800">Privacy Protection</h4>
                <p className="text-xs text-red-600 mt-1">
                  This system maintains strict privacy boundaries to protect counselor-student
                  confidentiality. Each counselor can only access their own interaction records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {onGoBack && (
              <Button variant="outline" onClick={onGoBack}>
                Go Back
              </Button>
            )}
            {onRetry && <Button onClick={onRetry}>Try Again</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
