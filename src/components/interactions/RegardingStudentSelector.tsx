import * as React from 'react';
import { SearchableDropdown, type SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import { useStudents, useCreateStudent } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSelect } from '@/components/common/FormSelect';
import { Plus } from 'lucide-react';
import { toast } from '@/utils/toast';
import type { Student } from '@/types/student';

interface RegardingStudentSelectorProps {
  value?: string;
  onChange?: (studentId: string | undefined) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

interface NewStudentFormData {
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  email?: string;
  phone?: string;
}

const GRADE_LEVELS = [
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: '9', label: '9th Grade' },
  { value: '10', label: '10th Grade' },
  { value: '11', label: '11th Grade' },
  { value: '12', label: '12th Grade' },
];

export function RegardingStudentSelector({
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  className,
}: RegardingStudentSelectorProps) {
  const { data: students = [], isLoading, error: studentsError } = useStudents();
  const createStudentMutation = useCreateStudent();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newStudentForm, setNewStudentForm] = React.useState<NewStudentFormData>({
    studentId: '',
    firstName: '',
    lastName: '',
    gradeLevel: '',
    email: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = React.useState<Partial<NewStudentFormData>>({});

  // Convert students to dropdown options
  const studentOptions: SearchableDropdownOption[] = React.useMemo(() => {
    return students.map((student) => ({
      value: student.id,
      label: `${student.firstName} ${student.lastName}`,
      subtitle: `${student.studentId} • Grade ${student.gradeLevel}`,
      metadata: { student },
    }));
  }, [students]);

  // Custom filter function for students
  const filterStudents = React.useCallback(
    (option: SearchableDropdownOption, query: string) => {
      const student = option.metadata?.student as Student;
      const lowerQuery = query.toLowerCase();
      
      return (
        student.firstName.toLowerCase().includes(lowerQuery) ||
        student.lastName.toLowerCase().includes(lowerQuery) ||
        student.studentId.toLowerCase().includes(lowerQuery) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(lowerQuery)
      );
    },
    []
  );

  const handleStudentSelect = (studentId: string) => {
    onChange?.(studentId || undefined);
  };

  const handleAddNewStudent = () => {
    setIsAddDialogOpen(true);
    setNewStudentForm({
      studentId: '',
      firstName: '',
      lastName: '',
      gradeLevel: '',
      email: '',
      phone: '',
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<NewStudentFormData> = {};

    if (!newStudentForm.studentId.trim()) {
      errors.studentId = 'Student ID is required';
    }
    if (!newStudentForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!newStudentForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!newStudentForm.gradeLevel) {
      errors.gradeLevel = 'Grade level is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStudent = async () => {
    if (!validateForm()) return;

    try {
      const newStudent = await createStudentMutation.mutateAsync({
        studentId: newStudentForm.studentId.trim(),
        firstName: newStudentForm.firstName.trim(),
        lastName: newStudentForm.lastName.trim(),
        gradeLevel: newStudentForm.gradeLevel,
        email: newStudentForm.email?.trim() || undefined,
        phone: newStudentForm.phone?.trim() || undefined,
      });

      // Select the newly created student
      onChange?.(newStudent.id);
      setIsAddDialogOpen(false);
      toast.success(`Student ${newStudent.firstName} ${newStudent.lastName} created and selected`);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Failed to create student:', error);
    }
  };

  const handleFormChange = (field: keyof NewStudentFormData, value: string) => {
    setNewStudentForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (studentsError) {
    return (
      <div className="space-y-2">
        <Label>Regarding Student {required && <span className="text-destructive">*</span>}</Label>
        <div className="text-sm text-destructive">
          Failed to load students. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <SearchableDropdown
            label="Regarding Student"
            placeholder="Search for a student..."
            options={studentOptions}
            value={value}
            onChange={handleStudentSelect}
            loading={isLoading}
            disabled={disabled}
            required={required}
            error={error}
            helperText={helperText || "Select which student this contact interaction is about"}
            emptyMessage="No students found"
            filterFn={filterStudents}
          />
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddNewStudent}
          disabled={disabled}
          className="mb-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add New
        </Button>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student-id">Student ID *</Label>
                  <Input
                    id="student-id"
                    value={newStudentForm.studentId}
                    onChange={(e) => handleFormChange('studentId', e.target.value)}
                    placeholder="e.g., S12345"
                    className={formErrors.studentId ? 'border-destructive' : ''}
                  />
                  {formErrors.studentId && (
                    <p className="text-sm text-destructive mt-1">{formErrors.studentId}</p>
                  )}
                </div>
                
                <FormSelect
                  label="Grade Level"
                  value={newStudentForm.gradeLevel}
                  onChange={(e) => handleFormChange('gradeLevel', e.target.value)}
                  options={GRADE_LEVELS}
                  required
                  error={formErrors.gradeLevel}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    value={newStudentForm.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    placeholder="First name"
                    className={formErrors.firstName ? 'border-destructive' : ''}
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-destructive mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="last-name">Last Name *</Label>
                  <Input
                    id="last-name"
                    value={newStudentForm.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    placeholder="Last name"
                    className={formErrors.lastName ? 'border-destructive' : ''}
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-destructive mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudentForm.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="student@school.edu"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newStudentForm.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={createStudentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateStudent}
                  disabled={createStudentMutation.isPending}
                >
                  {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}