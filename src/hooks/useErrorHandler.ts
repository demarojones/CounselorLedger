import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleApiError } from '@/utils/errorHandling';
import { useAuth } from '@/contexts/AuthContext';

export function useErrorHandler() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleError = useCallback(
    (error: any, options?: { customMessage?: string; showToast?: boolean }) => {
      return handleApiError(error, {
        ...options,
        onAuthError: () => {
          // Redirect to login on auth errors
          logout();
          navigate('/login');
        },
        onPermissionError: () => {
          // Redirect to unauthorized page
          navigate('/unauthorized');
        },
      });
    },
    [navigate, logout]
  );

  return { handleError };
}
