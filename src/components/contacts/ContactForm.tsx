import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {isEditMode ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8 py-2">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>

              <div className="space-y-4 pl-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput
                    label="First Name"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={e => handleChange('firstName', e.target.value)}
                    error={errors.firstName}
                    required
                    disabled={isSubmitting}
                  />

                  <FormInput
                    label="Last Name"
                    placeholder="Doe"
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
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>

              <div className="space-y-4 pl-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Email"
                    type="email"
                    placeholder="contact@example.com"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    error={errors.email}
                    disabled={isSubmitting}
                  />

                  <FormInput
                    label="Phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    error={errors.phone}
                    disabled={isSubmitting}
                  />
                </div>

                <FormInput
                  label="Organization"
                  placeholder="e.g., School name, company, or department"
                  value={formData.organization}
                  onChange={e => handleChange('organization', e.target.value)}
                  error={errors.organization}
                  disabled={isSubmitting}
                  helperText="Optional: Where this contact works or is affiliated"
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold">Additional Information</h3>
              </div>

              <div className="pl-4">
                <FormTextarea
                  label="Notes"
                  placeholder="Add any relevant notes about this contact..."
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  error={errors.notes}
                  disabled={isSubmitting}
                  rows={4}
                  helperText="Optional: Additional context or important details"
                />
              </div>
            </div>
          </form>
        </DialogBody>

        <DialogFooter className="pt-4 border-t flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto transition-all duration-200 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            onClick={handleSubmit}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
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
      </DialogContent>
    </Dialog>
  );
}
