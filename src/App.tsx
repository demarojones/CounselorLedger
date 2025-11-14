import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleBasedRoute } from './components/auth/RoleBasedRoute';
import { AppLayout } from './components/layout';
import { Toaster } from './components/ui/toast';
import { ErrorBoundary } from './components/common';
import {
  Dashboard,
  Interactions,
  Calendar,
  Students,
  StudentDetail,
  Contacts,
  Reports,
  Admin,
  NotFound,
  Unauthorized,
} from './pages';
import './App.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
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
