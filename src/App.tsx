import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleBasedRoute } from './components/auth/RoleBasedRoute';
import { AppLayout } from './components/layout';
import { Toaster } from './components/ui/toast';
import { ErrorBoundary, SetupErrorBoundary } from './components/common';
import { useTokenCleanup } from './hooks/useTokenCleanup';
import {
  Dashboard,
  Interactions,
  Calendar,
  Students,
  StudentDetail,
  Contacts,
  Reports,
  Admin,
  InitialSetup,
  InvitationAccept,
  NotFound,
  Unauthorized,
} from './pages';
import './App.css';

// Import integration verification for development
import './utils/integrationVerification';

// Component to handle authenticated user redirects for setup/invitation pages
function AuthenticatedRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <AuthenticatedRedirect>
              <Login />
            </AuthenticatedRedirect>
          }
        />
        <Route
          path="/setup/:token"
          element={
            <AuthenticatedRedirect>
              <SetupErrorBoundary context="setup">
                <InitialSetup />
              </SetupErrorBoundary>
            </AuthenticatedRedirect>
          }
        />
        <Route
          path="/invite/:token"
          element={
            <AuthenticatedRedirect>
              <SetupErrorBoundary context="invitation">
                <InvitationAccept />
              </SetupErrorBoundary>
            </AuthenticatedRedirect>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Routes accessible to both ADMIN and COUNSELOR */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interactions" element={<Interactions />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:studentId" element={<StudentDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/reports" element={<Reports />} />

          {/* Admin-only routes */}
          <Route
            path="/admin"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN']}>
                <Admin />
              </RoleBasedRoute>
            }
          />
        </Route>

        {/* Redirects and 404 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  // Initialize automatic token cleanup
  useTokenCleanup({
    intervalMs: 60 * 60 * 1000, // 1 hour
    autoStart: true,
    runOnMount: false,
  });

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AnimatedRoutes />
            <Toaster position="top-right" />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
