import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/common/FormInput';
import { FormSelect } from '@/components/common/FormSelect';
import { FormTextarea } from '@/components/common/FormTextarea';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Contact, ContactRelationship } from '@/types/contact';

interface ContactFormData {
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  organization: string;
  notes: string;
}

interface ContactFormProps {
  contact?: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  errors?: Record<string, string>;
}

const relationshipOptions: ContactRelationship[] = [
  'Parent',
  'Guardian',
  'Teacher',
  'Administrator',
  'Counselor',
  'Social Worker',
  'Other',
];

export function ContactForm({
  contact,
  open,
  onOpenChange,
  onSubmit,
  errors = {},
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    relationship: '',
    email: '',
    phone: '',
    organization: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!contact;

  // Reset form when contact changes or modal opens/closes
  useEffect(() => {
    if (open) {
      if (contact) {
        setFormData({
          firstName: contact.firstName,
          lastName: contact.lastName,
          relationship: contact.relationship,
          email: contact.email || '',
          phone: contact.phone || '',
          organization: contact.organization || '',
          notes: contact.notes || '',
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          relationship: '',
          email: '',
          phone: '',
          organization: '',
          notes: '',
        });
      }
    }
  }, [contact, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-lg w-full sm:max-w-2xl h-full sm:h-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="First Name"
              value={formData.firstName}
              onChange={e => handleChange('firstName', e.target.value)}
              error={errors.firstName}
              required
              disabled={isSubmitting}
            />

            <FormInput
              label="Last Name"
              value={formData.lastName}
              onChange={e => handleChange('lastName', e.target.value)}
              error={errors.lastName}
              required
              disabled={isSubmitting}
            />
          </div>

          <FormSelect
            label="Relationship"
            value={formData.relationship}
            onChange={e => handleChange('relationship', e.target.value)}
            error={errors.relationship}
            required
            disabled={isSubmitting}
          >
            <option value="">Select relationship...</option>
            {relationshipOptions.map(rel => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </FormSelect>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              error={errors.email}
              disabled={isSubmitting}
            />

            <FormInput
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              error={errors.phone}
              disabled={isSubmitting}
            />
          </div>

          <FormInput
            label="Organization"
            value={formData.organization}
            onChange={e => handleChange('organization', e.target.value)}
            error={errors.organization}
            disabled={isSubmitting}
            helperText="e.g., School name, company, or department"
          />

          <FormTextarea
            label="Notes"
            value={formData.notes}
            onChange={e => handleChange('notes', e.target.value)}
            error={errors.notes}
            disabled={isSubmitting}
            rows={4}
            helperText="Additional information about this contact"
          />

          <DialogFooter className="flex-col-reverse sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto relative">
              {isSubmitting && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                </span>
              )}
              <span className={isSubmitting ? 'invisible' : ''}>
                {isEditMode ? 'Update Contact' : 'Create Contact'}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
