import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { validateSetupToken, completeInitialSetup } from '@/services/setupService';
import { tenantSetupSchema, type TenantSetupFormData } from '@/schemas/setup';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageTransition, LoadingSpinner, SetupErrorBoundary } from '@/components/common';
import { toast } from '@/utils/toast';
import { useTokenPersistence } from '@/hooks/useTokenPersistence';
import { withErrorHandling } from '@/utils/errorHandling';
import type { SetupTokenValidation } from '@/types/setup';

export function InitialSetup() {
  return (
    <SetupErrorBoundary context="setup">
      <InitialSetupContent />
    </SetupErrorBoundary>
  );
}

function InitialSetupContent() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Token persistence hook
  const { cachedValidation, cacheValidation, handleNavigation, clearSession } = useTokenPersistence(
    {
      token,
      type: 'setup',
      autoUpdateOnNavigation: true,
      clearOnUnmount: true,
    }
  );

  // State for token validation
  const [tokenValidation, setTokenValidation] = useState<SetupTokenValidation | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // State for form
  const [formData, setFormData] = useState<TenantSetupFormData>({
    tenantName: '',
    subdomain: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    contactPhone: '',
    contactAddress: '',
    contactEmail: '',
    contactPersonName: '',
  });

  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof TenantSetupFormData, string>>
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('No setup token provided');
        setIsValidatingToken(false);
        return;
      }

      // Check if we have cached validation first
      if (cachedValidation && cachedValidation.isValid && cachedValidation.token === token) {
        console.log('Using cached setup token validation');
        setTokenValidation({
          isValid: true,
          tenantName: cachedValidation.tenantName,
          adminEmail: cachedValidation.adminEmail,
          expiresAt: cachedValidation.expiresAt,
        });

        // Pre-populate form with cached data
        setFormData(prev => ({
          ...prev,
          tenantName: cachedValidation.tenantName || '',
          adminEmail: cachedValidation.adminEmail || '',
        }));

        setIsValidatingToken(false);

        // Update navigation tracking
        handleNavigation(token, 'setup');
        return;
      }

      try {
        const { data: result, error } = await withErrorHandling(() => validateSetupToken(token), {
          context: 'setup_token_validation',
          errorMessage: 'Failed to validate setup token',
        });

        if (error || !result?.data?.isValid) {
          setTokenError(error?.message || result?.data?.error || 'Invalid setup token');
          setIsValidatingToken(false);
          return;
        }

        // Token is valid, pre-populate form and cache result
        const validationData = result.data;
        setTokenValidation(validationData);
        setFormData(prev => ({
          ...prev,
          tenantName: validationData.tenantName || '',
          adminEmail: validationData.adminEmail || '',
        }));

        // Cache validation for future navigation
        cacheValidation(token, {
          isValid: validationData.isValid,
          tenantName: validationData.tenantName,
          adminEmail: validationData.adminEmail,
          expiresAt: validationData.expiresAt,
        });

        // Track navigation
        handleNavigation(token, 'setup');

        setIsValidatingToken(false);
      } catch (error) {
        setTokenError('Failed to validate setup token');
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
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isValidatingToken, tokenError, tokenValidation, navigate, clearSession]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name as keyof TenantSetupFormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !tokenValidation?.isValid) {
      toast.error('Invalid setup token');
      return;
    }

    // Clear previous errors
    setValidationErrors({});

    // Validate form data
    try {
      tenantSetupSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof TenantSetupFormData, string>> = {};
        error.issues.forEach(issue => {
          if (issue.path[0]) {
            errors[issue.path[0] as keyof TenantSetupFormData] = issue.message;
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
        () => completeInitialSetup(token, formData),
        {
          context: 'initial_setup_completion',
          email: formData.adminEmail,
          errorMessage: 'Failed to complete setup',
        }
      );

      if (error || !result?.data) {
        toast.error(error?.message || 'Failed to complete setup');
        setIsSubmitting(false);
        return;
      }

      toast.success('Setup completed successfully! Welcome to School Counselor Ledger.');

      // Clear session data after successful setup
      clearSession();

      // Redirect to dashboard after successful setup
      navigate('/dashboard');
    } catch (error) {
      toast.error('An unexpected error occurred during setup');
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
              <h2 className="text-xl font-semibold">Validating Setup Token</h2>
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we verify your setup token...
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
              <h2 className="text-xl font-semibold text-destructive">Invalid Setup Token</h2>
              <p className="text-sm text-muted-foreground text-center">
                {tokenError || 'The setup token is invalid or has expired.'}
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

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-2xl p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-2xl">SC</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold">Initial System Setup</h1>
              <p className="mt-2 text-muted-foreground">
                Complete the setup for <strong>{tokenValidation.tenantName}</strong>
              </p>
            </div>

            {/* Setup Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold border-b pb-2">Organization Information</h2>

                <FormInput
                  label="Organization Name"
                  name="tenantName"
                  value={formData.tenantName}
                  onChange={handleInputChange}
                  error={validationErrors.tenantName}
                  disabled
                  helperText="This value is pre-set from your setup token"
                />

                <FormInput
                  label="Subdomain"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleInputChange}
                  error={validationErrors.subdomain}
                  placeholder="e.g., lincoln-high"
                  helperText="This will be used in your application URL"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Contact Phone (Optional)"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    error={validationErrors.contactPhone}
                    placeholder="(555) 123-4567"
                  />

                  <FormInput
                    label="Contact Email (Optional)"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    error={validationErrors.contactEmail}
                    placeholder="admin@school.edu"
                    helperText="Primary administrative contact email"
                  />
                </div>

                <FormInput
                  label="Contact Person Name (Optional)"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleInputChange}
                  error={validationErrors.contactPersonName}
                  placeholder="Jane Smith, Principal"
                  helperText="Name and title of primary administrative contact"
                />

                <div>
                  <label htmlFor="contactAddress" className="block text-sm font-medium mb-2">
                    Contact Address (Optional)
                  </label>
                  <textarea
                    id="contactAddress"
                    name="contactAddress"
                    rows={3}
                    value={formData.contactAddress}
                    onChange={handleInputChange}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter your organization's address"
                  />
                  {validationErrors.contactAddress && (
                    <p className="text-sm font-medium text-destructive mt-1">
                      {validationErrors.contactAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Administrator Account */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold border-b pb-2">Administrator Account</h2>

                <FormInput
                  label="Email Address"
                  name="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  error={validationErrors.adminEmail}
                  disabled
                  helperText="This value is pre-set from your setup token"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="First Name"
                    name="adminFirstName"
                    value={formData.adminFirstName}
                    onChange={handleInputChange}
                    error={validationErrors.adminFirstName}
                    placeholder="John"
                  />

                  <FormInput
                    label="Last Name"
                    name="adminLastName"
                    value={formData.adminLastName}
                    onChange={handleInputChange}
                    error={validationErrors.adminLastName}
                    placeholder="Doe"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Password"
                    name="adminPassword"
                    type="password"
                    value={formData.adminPassword}
                    onChange={handleInputChange}
                    error={validationErrors.adminPassword}
                    helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
                  />

                  <FormInput
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={validationErrors.confirmPassword}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Completing Setup...
                    </span>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
