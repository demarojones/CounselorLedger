import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { validateInvitationToken, acceptInvitation } from '@/services/invitationService';
import { userRegistrationSchema, type UserRegistrationFormData } from '@/schemas/setup';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageTransition, LoadingSpinner, SetupErrorBoundary } from '@/components/common';
import { toast } from '@/utils/toast';
import { useTokenPersistence } from '@/hooks/useTokenPersistence';
import { withErrorHandling } from '@/utils/errorHandling';
import type { InvitationValidation } from '@/types/setup';

export function InvitationAccept() {
  return (
    <SetupErrorBoundary context="invitation">
      <InvitationAcceptContent />
    </SetupErrorBoundary>
  );
}

function InvitationAcceptContent() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Token persistence hook
  const { cachedValidation, cacheValidation, handleNavigation, clearSession } = useTokenPersistence(
    {
      token,
      type: 'invitation',
      autoUpdateOnNavigation: true,
      clearOnUnmount: true,
    }
  );

  // State for token validation
  const [tokenValidation, setTokenValidation] = useState<InvitationValidation | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // State for form
  const [formData, setFormData] = useState<UserRegistrationFormData>({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof UserRegistrationFormData, string>>
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('No invitation token provided');
        setIsValidatingToken(false);
        return;
      }

      // Check if we have cached validation first
      if (cachedValidation && cachedValidation.isValid && cachedValidation.token === token) {
        console.log('Using cached invitation token validation');
        setTokenValidation({
          isValid: true,
          email: cachedValidation.email,
          role: cachedValidation.role as 'ADMIN' | 'COUNSELOR',
          tenantId: cachedValidation.tenantId,
          expiresAt: cachedValidation.expiresAt,
        });
        setIsValidatingToken(false);

        // Update navigation tracking
        handleNavigation(token, 'invitation');
        return;
      }

      try {
        const { data: result, error } = await withErrorHandling(
          () => validateInvitationToken(token),
          {
            context: 'invitation_token_validation',
            errorMessage: 'Failed to validate invitation token',
          }
        );

        if (error || !result?.data?.isValid) {
          setTokenError(error?.message || result?.data?.error || 'Invalid invitation token');
          setIsValidatingToken(false);
          return;
        }

        // Token is valid - cache the result
        const validationData = result.data;
        setTokenValidation(validationData);

        // Cache validation for future navigation
        cacheValidation(token, {
          isValid: validationData.isValid,
          email: validationData.email,
          role: validationData.role,
          tenantId: validationData.tenantId,
          expiresAt: validationData.expiresAt,
        });

        // Track navigation
        handleNavigation(token, 'invitation');

        setIsValidatingToken(false);
      } catch (error) {
        setTokenError('Failed to validate invitation token');
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token, cachedValidation, cacheValidation, handleNavigation]);

  // Redirect to login if token is invalid
  useEffect(() => {
    if (!isValidatingToken && (tokenError || !tokenValidation?.isValid)) {
      // Clear session data for invalid tokens
      clearSession();

      const timer = setTimeout(() => {
        navigate('/login');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isValidatingToken, tokenError, tokenValidation, navigate, clearSession]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name as keyof UserRegistrationFormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !tokenValidation?.isValid) {
      toast.error('Invalid invitation token');
      return;
    }

    // Clear previous errors
    setValidationErrors({});

    // Validate form data
    try {
      userRegistrationSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof UserRegistrationFormData, string>> = {};
        error.issues.forEach(issue => {
          if (issue.path[0]) {
            errors[issue.path[0] as keyof UserRegistrationFormData] = issue.message;
          }
        });
        setValidationErrors(errors);
        toast.error('Please fix the form errors before submitting');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data: result, error } = await withErrorHandling(
        () => acceptInvitation(token, formData),
        {
          context: 'invitation_acceptance',
          email: tokenValidation.email,
          errorMessage: 'Failed to accept invitation',
        }
      );

      if (error || !result?.data?.success) {
        toast.error(error?.message || result?.data?.error || 'Failed to accept invitation');
        setIsSubmitting(false);
        return;
      }

      // Show success message with appropriate feedback about auto-login
      if (result.data.autoLoginSuccess !== false) {
        toast.success('Account created successfully! Welcome to School Counselor Ledger.');
      } else {
        toast.success('Account created successfully! Please log in with your new credentials.');
      }

      // Clear session data after successful registration
      clearSession();

      // Redirect to dashboard after successful registration
      // If auto-login failed, user will be redirected to login page by auth guards
      navigate('/dashboard');
    } catch (error) {
      toast.error('An unexpected error occurred during registration');
      setIsSubmitting(false);
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <Card className="w-full max-w-md p-8">
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner size="lg" />
              <h2 className="text-xl font-semibold">Validating Invitation</h2>
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we verify your invitation...
              </p>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Error state for invalid token
  if (tokenError || !tokenValidation?.isValid) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <Card className="w-full max-w-md p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="text-destructive text-2xl">⚠</span>
              </div>
              <h2 className="text-xl font-semibold text-destructive">Invalid Invitation</h2>
              <p className="text-sm text-muted-foreground text-center">
                {tokenError || 'The invitation token is invalid or has expired.'}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Redirecting to login page in a few seconds...
              </p>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const getRoleDisplayName = (role: string) => {
    return role === 'ADMIN' ? 'Administrator' : 'Counselor';
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-2xl">SC</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold">Join Your Team</h1>
              <p className="mt-2 text-muted-foreground">
                You've been invited as a{' '}
                <strong>{getRoleDisplayName(tokenValidation.role!)}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Email: <strong>{tokenValidation.email}</strong>
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={validationErrors.firstName}
                  placeholder="John"
                  required
                />

                <FormInput
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={validationErrors.lastName}
                  placeholder="Doe"
                  required
                />
              </div>

              <FormInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={validationErrors.password}
                helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
                required
              />

              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={validationErrors.confirmPassword}
                required
              />

              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </form>

            {/* Expiration Notice */}
            {tokenValidation.expiresAt && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  This invitation expires on {tokenValidation.expiresAt.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
