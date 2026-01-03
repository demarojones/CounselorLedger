import { useState } from 'react';
import { z } from 'zod';
import { createInvitation } from '@/services/invitationService';
import { invitationFormSchema, type InvitationFormData } from '@/schemas/setup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

interface UserInvitationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvitationSent: () => void;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  submit?: string;
}

export function UserInvitationForm({
  open,
  onOpenChange,
  onInvitationSent,
}: UserInvitationFormProps) {
  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'COUNSELOR',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'COUNSELOR',
    });
    setErrors({});
    setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    try {
      invitationFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach(err => {
          const field = err.path[0] as keyof FormErrors;
          if (field && field !== 'submit') {
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await createInvitation(formData);

      if (result.error) {
        setErrors({
          submit: result.error.message || 'Failed to create invitation',
        });
        return;
      }

      if (!result.data?.success) {
        setErrors({
          submit: result.data?.error || 'Failed to create invitation',
        });
        return;
      }

      // Success
      setSuccessMessage(
        `Invitation sent successfully to ${formData.email}! They will receive an email with instructions to join your organization.`
      );

      // Reset form after a short delay to show success message
      setTimeout(() => {
        resetForm();
        onInvitationSent();
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Error creating invitation:', error);
      setErrors({
        submit: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof InvitationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear submit error when user makes changes
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite New User
          </DialogTitle>
        </DialogHeader>

        {successMessage ? (
          <div className="py-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="user@example.com"
                disabled={isSubmitting}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={e => handleChange('firstName', e.target.value)}
                  placeholder="John"
                  disabled={isSubmitting}
                  autoComplete="given-name"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={e => handleChange('lastName', e.target.value)}
                  placeholder="Doe"
                  disabled={isSubmitting}
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                id="role"
                value={formData.role}
                onChange={e => handleChange('role', e.target.value as 'ADMIN' | 'COUNSELOR')}
                disabled={isSubmitting}
              >
                <option value="COUNSELOR">Counselor</option>
                <option value="ADMIN">Admin</option>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.role}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.role === 'ADMIN'
                  ? 'Admins can manage users and system settings'
                  : 'Counselors can manage student interactions and reports'}
              </p>
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.submit}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="relative">
                {isSubmitting && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </span>
                )}
                <span className={isSubmitting ? 'invisible' : ''}>Send Invitation</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
