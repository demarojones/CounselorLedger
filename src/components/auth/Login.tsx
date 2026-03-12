import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema } from '../../schemas/auth';
import type { LoginFormData } from '../../schemas/auth';
import { toast } from '../../utils/toast';
import { z } from 'zod';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const { login, isLoading, error: authError, clearError } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Clear any auth errors when component mounts (e.g., "no session" errors)
  React.useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setValidationErrors({});
    clearError();

    // Validate form data
    try {
      loginSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { email?: string; password?: string } = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof typeof errors] = err.message;
          }
        });
        setValidationErrors(errors);
        return;
      }
    }

    // Attempt login
    const response = await login(formData);

    if (response.user && !response.error) {
      toast.success('Login successful!');

      // Redirect to the intended destination or dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else if (response.error) {
      toast.error(response.error.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img src="/counselor_ledger_logo.svg" alt="Beacon" className="w-12 h-12" />
            <span className="text-2xl font-bold text-white">Beacon</span>
          </div>
          <div className="space-y-6 text-white/90">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Streamline Your Counseling Workflow
            </h1>
            <p className="text-lg text-white/80">
              Track student interactions, manage contacts, and generate comprehensive reports—all in one secure platform.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Secure & Private</h3>
                  <p className="text-sm text-white/70">FERPA-compliant with role-based access control</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Comprehensive Reporting</h3>
                  <p className="text-sm text-white/70">Generate insights with powerful analytics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Easy Collaboration</h3>
                  <p className="text-sm text-white/70">Share data seamlessly across your team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-white/60 text-sm">
          © {currentYear} Beacon. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/counselor_ledger_logo.svg" alt="Beacon" className="w-16 h-16" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="mt-2 text-gray-600">Sign in to your account to continue</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
          {authError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                  <div className="mt-1 text-sm text-red-700">
                    {authError.message || 'Invalid email or password'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                  validationErrors.email
                    ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="you@example.com"
              />
              {validationErrors.email && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                  validationErrors.password
                    ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="••••••••"
              />
              {validationErrors.password && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.password}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
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
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">New to Beacon?</span>
            </div>
          </div>

          <Link
            to="/register"
            className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create an account
          </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
