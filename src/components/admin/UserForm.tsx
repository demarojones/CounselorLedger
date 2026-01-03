import { useState, useEffect } from 'react';
import type { User, UserRole } from '@/types/user';
import { supabase } from '@/services/supabase';
import { validateTenantOperation } from '@/services/supabaseHelpers';
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
import { userFormSchema } from '@/schemas/user';
import { z } from 'zod';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'COUNSELOR',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'COUNSELOR',
      });
    }
    setErrors({});
  }, [user, open]);

  const validateForm = (): boolean => {
    try {
      userFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach(err => {
          const field = err.path[0] as keyof FormErrors;
          if (field) {
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

    try {
      // Validate tenant operation
      const validation = await validateTenantOperation();
      if (!validation.isValid) {
        alert(
          validation.error || 'Unable to determine tenant context. Please refresh and try again.'
        );
        return;
      }

      const { context } = validation;

      if (user) {
        // Update existing user - ensure we only update users in our tenant
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .eq('tenant_id', context!.tenantId); // Ensure tenant boundary

        if (updateError) throw updateError;
      } else {
        // Create new user - ensure tenant association
        const { error: createError } = await supabase.from('users').insert({
          id: crypto.randomUUID(),
          tenant_id: context!.tenantId, // Explicit tenant association
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (createError) throw createError;

        // Mock: Send invitation email (in production, use Supabase Auth)
        console.log('Invitation email sent to:', formData.email);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Failed to save user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="user@example.com"
              disabled={!!user}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={e => handleChange('firstName', e.target.value)}
              placeholder="John"
            />
            {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={e => handleChange('lastName', e.target.value)}
              placeholder="Doe"
            />
            {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              id="role"
              value={formData.role}
              onChange={e => handleChange('role', e.target.value as UserRole)}
            >
              <option value="COUNSELOR">Counselor</option>
              <option value="ADMIN">Admin</option>
            </Select>
            {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
              <span className={isSubmitting ? 'invisible' : ''}>
                {user ? 'Update User' : 'Create User'}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
