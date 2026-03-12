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
import { StudentFormModal } from '@/components/students/StudentFormModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
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
  onStudentAdded?: (student: Student) => void; // Callback when a new student is added
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
  onStudentAdded,
  isLoading = false,
  submitLabel = 'Save Interaction',
}: InteractionFormProps) {
  // Form state
  const [type, setType] = useState<'student' | 'contact'>(initialData?.type || 'student');
  const [studentId, setStudentId] = useState(initialData?.studentId || '');
  const [contactId, setContactId] = useState(initialData?.contactId || '');
  const [regardingStudentId, setRegardingStudentId] = useState(
    initialData?.regardingStudentId || ''
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(initialData?.subcategoryId || '');
  const [customReason, setCustomReason] = useState(initialData?.customReason || '');
  const [startTime, setStartTime] = useState(initialData?.startTime || '');
  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.durationMinutes?.toString() || ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [needsFollowUp, setNeedsFollowUp] = useState(initialData?.needsFollowUp || false);
  const [followUpDate, setFollowUpDate] = useState(initialData?.followUpDate || '');
  const [followUpNotes, setFollowUpNotes] = useState(initialData?.followUpNotes || '');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Student modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Determine if we're in edit mode (editing existing interaction)
  const isEditMode = !!initialData && Object.keys(initialData).length > 0;

  // Handle new student creation
  const handleStudentCreated = (newStudent: Student) => {
    // Auto-select the newly created student
    setStudentId(newStudent.id);
    setErrors(prev => ({ ...prev, studentId: '' }));
    
    // Close the modal
    setIsStudentModalOpen(false);
    
    // Notify parent component if callback provided
    onStudentAdded?.(newStudent);
  };

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
    return subcategories.filter(sub => sub.categoryId === categoryId);
  }, [categoryId, subcategories]);

  // Check if "Other | Custom" is selected
  const isCustomSubcategory = useMemo(() => {
    if (!subcategoryId) return false;
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory?.name.toLowerCase() === 'custom';
  }, [subcategoryId, subcategories]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (categoryId && subcategoryId) {
      const isValid = filteredSubcategories.some(sub => sub.id === subcategoryId);
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
      students.map(student => ({
        value: student.id,
        label: `${student.firstName} ${student.lastName}`,
        subtitle: `${student.studentId} - Grade ${student.gradeLevel}`,
      })),
    [students]
  );

  // Convert contacts to dropdown options
  const contactOptions: SearchableDropdownOption[] = useMemo(
    () =>
      contacts.map(contact => ({
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
        error.issues.forEach(err => {
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Interaction Type Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h3 className="text-lg font-semibold">Interaction Details</h3>
        </div>
        
        <div className="space-y-2 pl-4">
          <Label htmlFor="interaction-type">
            Interaction Type <span className="text-destructive">*</span>
          </Label>
          <FormSelect
            id="interaction-type"
            value={type}
            onChange={e => {
              setType(e.target.value as 'student' | 'contact');
              setStudentId('');
              setContactId('');
              setRegardingStudentId('');
              setErrors(prev => ({
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
      </div>

      {/* Student/Contact Selection */}
      <div className="space-y-4 pl-4">
        {type === 'student' ? (
          <div className="space-y-2">
            <Label>
              Student <span className="text-destructive">*</span>
            </Label>
            {!isEditMode ? (
              // Create mode: Show dropdown with "Add New" button
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableDropdown
                    placeholder="Search for a student..."
                    options={studentOptions}
                    value={studentId}
                    onChange={value => {
                      setStudentId(value);
                      setErrors(prev => ({ ...prev, studentId: '' }));
                    }}
                    error={errors.studentId}
                    disabled={isLoading}
                    required
                    emptyMessage="No students found"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setIsStudentModalOpen(true)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </Button>
              </div>
            ) : (
              // Edit mode: Show dropdown only (no "Add New" button)
              <SearchableDropdown
                placeholder="Search for a student..."
                options={studentOptions}
                value={studentId}
                onChange={value => {
                  setStudentId(value);
                  setErrors(prev => ({ ...prev, studentId: '' }));
                }}
                error={errors.studentId}
                disabled={isLoading}
                required
                emptyMessage="No students found"
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <SearchableDropdown
              label="Contact"
              placeholder="Search for a contact..."
              options={contactOptions}
              value={contactId}
              onChange={value => {
                setContactId(value);
                setErrors(prev => ({ ...prev, contactId: '' }));
              }}
              error={errors.contactId}
              disabled={isLoading}
              required
              emptyMessage="No contacts found"
            />

            {/* Regarding Student Selector - only shown for contact interactions */}
            <RegardingStudentSelector
              value={regardingStudentId}
              onChange={value => {
                setRegardingStudentId(value || '');
                setErrors(prev => ({ ...prev, regardingStudentId: '' }));
              }}
              error={errors.regardingStudentId}
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      {/* Reason Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h3 className="text-lg font-semibold">Reason for Interaction</h3>
        </div>

        <div className="space-y-4 pl-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Reason Category <span className="text-destructive">*</span>
            </Label>
            <FormSelect
              id="category"
              value={categoryId}
              onChange={e => {
                setCategoryId(e.target.value);
                setErrors(prev => ({ ...prev, categoryId: '' }));
              }}
              error={errors.categoryId}
              disabled={isLoading}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
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
                onChange={e => setSubcategoryId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select a subcategory (optional)</option>
                {filteredSubcategories.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </FormSelect>
            </div>
          )}

          {/* Custom Reason (shown when "Other | Custom" is selected) */}
          {isCustomSubcategory && (
            <div className="space-y-2">
              <FormInput
                label="Custom Reason"
                placeholder="Enter custom reason..."
                value={customReason}
                onChange={e => {
                  setCustomReason(e.target.value);
                  setErrors(prev => ({ ...prev, customReason: '' }));
                }}
                error={errors.customReason}
                disabled={isLoading}
                required
              />
            </div>
          )}
        </div>
      </div>

      {/* Time & Duration Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h3 className="text-lg font-semibold">Time & Duration</h3>
        </div>

        <div className="space-y-4 pl-4">
          {/* Start Time and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateTimePicker
              label="Start Time"
              type="datetime-local"
              value={startTime}
              onChange={value => {
                setStartTime(value);
                setErrors(prev => ({ ...prev, startTime: '' }));
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
              onChange={e => {
                setDurationMinutes(e.target.value);
                setErrors(prev => ({ ...prev, durationMinutes: '' }));
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
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold text-primary">End Time:</span>{' '}
                <span className="text-foreground">{endTime}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h3 className="text-lg font-semibold">Additional Information</h3>
        </div>

        <div className="pl-4">
          <FormTextarea
            label="Notes"
            placeholder="Add any relevant notes about this interaction..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={isLoading}
            rows={4}
          />
        </div>
      </div>

      {/* Follow-up Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h3 className="text-lg font-semibold">Follow-up</h3>
        </div>

        <div className="pl-4 space-y-4">
          {/* Follow-up Checkbox */}
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
            <Input
              type="checkbox"
              id="needs-follow-up"
              checked={needsFollowUp}
              onChange={e => {
                setNeedsFollowUp(e.target.checked);
                if (!e.target.checked) {
                  setFollowUpDate('');
                  setFollowUpNotes('');
                  setErrors(prev => ({ ...prev, followUpDate: '' }));
                }
              }}
              disabled={isLoading}
              className="h-5 w-5 cursor-pointer"
            />
            <Label htmlFor="needs-follow-up" className="cursor-pointer font-medium">
              This interaction needs follow-up
            </Label>
          </div>

          {/* Follow-up Fields (conditional) */}
          {needsFollowUp && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/30 ml-2 animate-in slide-in-from-left-2 duration-300">
              <DateTimePicker
                label="Follow-up Date"
                type="date"
                value={followUpDate}
                onChange={value => {
                  setFollowUpDate(value);
                  setErrors(prev => ({ ...prev, followUpDate: '' }));
                }}
                error={errors.followUpDate}
                disabled={isLoading}
                required
              />

              <FormTextarea
                label="Follow-up Notes"
                placeholder="Add notes about what needs to be followed up..."
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto transition-all duration-200 hover:bg-muted"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full sm:w-auto relative bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
        >
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </span>
          )}
          <span className={isLoading ? 'invisible' : ''}>{submitLabel}</span>
        </Button>
      </div>

      {/* Student Creation Modal - Only show in create mode */}
      {!isEditMode && (
        <StudentFormModal
          open={isStudentModalOpen}
          onOpenChange={setIsStudentModalOpen}
          onSuccess={handleStudentCreated}
        />
      )}
    </form>
  );
}
