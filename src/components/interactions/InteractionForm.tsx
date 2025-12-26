import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/common/FormInput';
import { FormSelect } from '@/components/common/FormSelect';
import { FormTextarea } from '@/components/common/FormTextarea';
import { DateTimePicker } from '@/components/common/DateTimePicker';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import type { SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import { RegardingStudentSelector } from './RegardingStudentSelector';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { InteractionFormData } from '@/types/interaction';
import type { Student } from '@/types/student';
import type { Contact } from '@/types/contact';
import type { ReasonCategory, ReasonSubcategory } from '@/types/reason';
import { interactionFormSchema } from '@/schemas/interaction';
import { z } from 'zod';

export interface InteractionFormProps {
  initialData?: Partial<InteractionFormData>;
  students: Student[];
  contacts: Contact[];
  categories: ReasonCategory[];
  subcategories: ReasonSubcategory[];
  onSubmit: (data: InteractionFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function InteractionForm({
  initialData,
  students,
  contacts,
  categories,
  subcategories,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Interaction',
}: InteractionFormProps) {
  // Form state
  const [type, setType] = useState<'student' | 'contact'>(
    initialData?.type || 'student'
  );
  const [studentId, setStudentId] = useState(initialData?.studentId || '');
  const [contactId, setContactId] = useState(initialData?.contactId || '');
  const [regardingStudentId, setRegardingStudentId] = useState(
    initialData?.regardingStudentId || ''
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(
    initialData?.subcategoryId || ''
  );
  const [customReason, setCustomReason] = useState(
    initialData?.customReason || ''
  );
  const [startTime, setStartTime] = useState(initialData?.startTime || '');
  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.durationMinutes?.toString() || ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [needsFollowUp, setNeedsFollowUp] = useState(
    initialData?.needsFollowUp || false
  );
  const [followUpDate, setFollowUpDate] = useState(
    initialData?.followUpDate || ''
  );
  const [followUpNotes, setFollowUpNotes] = useState(
    initialData?.followUpNotes || ''
  );

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate end time
  const endTime = useMemo(() => {
    if (!startTime || !durationMinutes) return '';

    try {
      const start = new Date(startTime);
      const duration = parseInt(durationMinutes, 10);

      if (isNaN(duration) || duration <= 0) return '';

      const end = new Date(start.getTime() + duration * 60000);
      return end.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  }, [startTime, durationMinutes]);

  // Filter subcategories by selected category
  const filteredSubcategories = useMemo(() => {
    if (!categoryId) return [];
    return subcategories.filter((sub) => sub.categoryId === categoryId);
  }, [categoryId, subcategories]);

  // Check if "Other | Custom" is selected
  const isCustomSubcategory = useMemo(() => {
    if (!subcategoryId) return false;
    const subcategory = subcategories.find((sub) => sub.id === subcategoryId);
    return subcategory?.name.toLowerCase() === 'custom';
  }, [subcategoryId, subcategories]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (categoryId && subcategoryId) {
      const isValid = filteredSubcategories.some(
        (sub) => sub.id === subcategoryId
      );
      if (!isValid) {
        setSubcategoryId('');
        setCustomReason('');
      }
    }
  }, [categoryId, subcategoryId, filteredSubcategories]);

  // Reset custom reason when subcategory changes
  useEffect(() => {
    if (!isCustomSubcategory) {
      setCustomReason('');
    }
  }, [isCustomSubcategory]);

  // Convert students to dropdown options
  const studentOptions: SearchableDropdownOption[] = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: `${student.firstName} ${student.lastName}`,
        subtitle: `${student.studentId} - Grade ${student.gradeLevel}`,
      })),
    [students]
  );

  // Convert contacts to dropdown options
  const contactOptions: SearchableDropdownOption[] = useMemo(
    () =>
      contacts.map((contact) => ({
        value: contact.id,
        label: `${contact.firstName} ${contact.lastName}`,
        subtitle: `${contact.relationship}${contact.organization ? ` - ${contact.organization}` : ''}`,
      })),
    [contacts]
  );

  const validate = (): boolean => {
    const formData = {
      type,
      studentId: type === 'student' ? studentId : undefined,
      contactId: type === 'contact' ? contactId : undefined,
      regardingStudentId: type === 'contact' && regardingStudentId ? regardingStudentId : undefined,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      customReason: isCustomSubcategory ? customReason : undefined,
      startTime,
      durationMinutes: parseInt(durationMinutes, 10),
      notes: notes || undefined,
      needsFollowUp,
      followUpDate: needsFollowUp ? followUpDate : undefined,
      followUpNotes: needsFollowUp ? followUpNotes : undefined,
    };

    try {
      interactionFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as string;
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

    if (!validate()) {
      return;
    }

    const formData: InteractionFormData = {
      type,
      studentId: type === 'student' ? studentId : undefined,
      contactId: type === 'contact' ? contactId : undefined,
      regardingStudentId: type === 'contact' && regardingStudentId ? regardingStudentId : undefined,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      customReason: isCustomSubcategory ? customReason : undefined,
      startTime,
      durationMinutes: parseInt(durationMinutes, 10),
      notes: notes || undefined,
      needsFollowUp,
      followUpDate: needsFollowUp ? followUpDate : undefined,
      followUpNotes: needsFollowUp ? followUpNotes : undefined,
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Interaction Type */}
      <div className="space-y-2">
        <Label htmlFor="interaction-type">
          Interaction Type <span className="text-destructive">*</span>
        </Label>
        <FormSelect
          id="interaction-type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as 'student' | 'contact');
            setStudentId('');
            setContactId('');
            setRegardingStudentId('');
            setErrors((prev) => ({
              ...prev,
              studentId: '',
              contactId: '',
              regardingStudentId: '',
            }));
          }}
          disabled={isLoading}
        >
          <option value="student">Student</option>
          <option value="contact">Contact</option>
        </FormSelect>
      </div>

      {/* Student/Contact Selection */}
      {type === 'student' ? (
        <SearchableDropdown
          label="Student"
          placeholder="Search for a student..."
          options={studentOptions}
          value={studentId}
          onChange={(value) => {
            setStudentId(value);
            setErrors((prev) => ({ ...prev, studentId: '' }));
          }}
          error={errors.studentId}
          disabled={isLoading}
          required
          emptyMessage="No students found"
        />
      ) : (
        <>
          <SearchableDropdown
            label="Contact"
            placeholder="Search for a contact..."
            options={contactOptions}
            value={contactId}
            onChange={(value) => {
              setContactId(value);
              setErrors((prev) => ({ ...prev, contactId: '' }));
            }}
            error={errors.contactId}
            disabled={isLoading}
            required
            emptyMessage="No contacts found"
          />
          
          {/* Regarding Student Selector - only shown for contact interactions */}
          <RegardingStudentSelector
            value={regardingStudentId}
            onChange={(value) => {
              setRegardingStudentId(value || '');
              setErrors((prev) => ({ ...prev, regardingStudentId: '' }));
            }}
            error={errors.regardingStudentId}
            disabled={isLoading}
          />
        </>
      )}

      {/* Category Selection */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Reason Category <span className="text-destructive">*</span>
        </Label>
        <FormSelect
          id="category"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setErrors((prev) => ({ ...prev, categoryId: '' }));
          }}
          error={errors.categoryId}
          disabled={isLoading}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </FormSelect>
      </div>

      {/* Subcategory Selection */}
      {categoryId && filteredSubcategories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subcategory">Reason Subcategory</Label>
          <FormSelect
            id="subcategory"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select a subcategory (optional)</option>
            {filteredSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </FormSelect>
        </div>
      )}

      {/* Custom Reason (shown when "Other | Custom" is selected) */}
      {isCustomSubcategory && (
        <FormInput
          label="Custom Reason"
          placeholder="Enter custom reason..."
          value={customReason}
          onChange={(e) => {
            setCustomReason(e.target.value);
            setErrors((prev) => ({ ...prev, customReason: '' }));
          }}
          error={errors.customReason}
          disabled={isLoading}
          required
        />
      )}

      {/* Start Time and Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateTimePicker
          label="Start Time"
          type="datetime-local"
          value={startTime}
          onChange={(value) => {
            setStartTime(value);
            setErrors((prev) => ({ ...prev, startTime: '' }));
          }}
          error={errors.startTime}
          disabled={isLoading}
          required
        />

        <FormInput
          label="Duration (minutes)"
          type="number"
          placeholder="e.g., 30"
          value={durationMinutes}
          onChange={(e) => {
            setDurationMinutes(e.target.value);
            setErrors((prev) => ({ ...prev, durationMinutes: '' }));
          }}
          error={errors.durationMinutes}
          disabled={isLoading}
          required
          min="1"
          max="480"
        />
      </div>

      {/* Calculated End Time */}
      {endTime && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">End Time:</span> {endTime}
          </p>
        </div>
      )}

      {/* Notes */}
      <FormTextarea
        label="Notes"
        placeholder="Add any relevant notes about this interaction..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isLoading}
        rows={4}
      />

      {/* Follow-up Checkbox */}
      <div className="flex items-center space-x-2">
        <Input
          type="checkbox"
          id="needs-follow-up"
          checked={needsFollowUp}
          onChange={(e) => {
            setNeedsFollowUp(e.target.checked);
            if (!e.target.checked) {
              setFollowUpDate('');
              setFollowUpNotes('');
              setErrors((prev) => ({ ...prev, followUpDate: '' }));
            }
          }}
          disabled={isLoading}
          className="h-4 w-4"
        />
        <Label htmlFor="needs-follow-up" className="cursor-pointer">
          This interaction needs follow-up
        </Label>
      </div>

      {/* Follow-up Fields (conditional) */}
      {needsFollowUp && (
        <div className="space-y-4 pl-6 border-l-2 border-primary/20">
          <DateTimePicker
            label="Follow-up Date"
            type="date"
            value={followUpDate}
            onChange={(value) => {
              setFollowUpDate(value);
              setErrors((prev) => ({ ...prev, followUpDate: '' }));
            }}
            error={errors.followUpDate}
            disabled={isLoading}
            required
          />

          <FormTextarea
            label="Follow-up Notes"
            placeholder="Add notes about what needs to be followed up..."
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto relative">
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </span>
          )}
          <span className={isLoading ? 'invisible' : ''}>{submitLabel}</span>
        </Button>
      </div>
    </form>
  );
}
