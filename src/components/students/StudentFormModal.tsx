import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/common/FormInput';
import { FormSelect } from '@/components/common/FormSelect';
import { useCreateStudent, useUpdateStudent } from '@/hooks/useStudents';
import type { Student } from '@/types/student';
import { Loader2 } from 'lucide-react';

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSuccess?: (student: Student) => void; // Callback when student is successfully created/updated
}

export function StudentFormModal({ open, onOpenChange, student, onSuccess }: StudentFormModalProps) {
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const isEditing = !!student;

  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    gradeLevel: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (student) {
      // Convert grade level from "9th Grade" format to "9" format for the form
      const convertGradeLevel = (gradeLevel: string) => {
        if (gradeLevel.includes('th Grade')) {
          return gradeLevel.replace('th Grade', '');
        }
        return gradeLevel;
      };

      setFormData({
        studentId: student.studentId || '',
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        gradeLevel: convertGradeLevel(student.gradeLevel || ''),
        email: student.email || '',
        phone: student.phone || '',
      });
    } else {
      setFormData({
        studentId: '',
        firstName: '',
        lastName: '',
        gradeLevel: '',
        email: '',
        phone: '',
      });
    }
    setErrors({});
  }, [student, open]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Convert grade level back to full format
    const convertGradeLevelToFull = (gradeLevel: string) => {
      if (gradeLevel && !gradeLevel.includes('Grade')) {
        return `${gradeLevel}th Grade`;
      }
      return gradeLevel;
    };

    const submissionData = {
      studentId: formData.studentId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      gradeLevel: convertGradeLevelToFull(formData.gradeLevel),
      email: formData.email || undefined,
      phone: formData.phone || undefined,
    };

    try {
      let resultStudent: Student;
      
      if (isEditing && student) {
        // Update existing student
        resultStudent = await updateStudent.mutateAsync({
          id: student.id,
          ...submissionData,
        });
      } else {
        // Create new student
        resultStudent = await createStudent.mutateAsync(submissionData);
      }

      // Reset form and close modal
      setFormData({
        studentId: '',
        firstName: '',
        lastName: '',
        gradeLevel: '',
        email: '',
        phone: '',
      });
      setErrors({});
      onOpenChange(false);
      
      // Call success callback with the created/updated student
      onSuccess?.(resultStudent);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} student:`, error);
    }
  };

  const handleCancel = () => {
    setFormData({
      studentId: '',
      firstName: '',
      lastName: '',
      gradeLevel: '',
      email: '',
      phone: '',
    });
    setErrors({});
    onOpenChange(false);
  };

  const isPending = createStudent.isPending || updateStudent.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the student's information below. Fields marked with * are required."
              : "Enter the student's information below. Fields marked with * are required."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Student ID"
              placeholder="e.g., S12345"
              value={formData.studentId}
              onChange={e => handleChange('studentId', e.target.value)}
              error={errors.studentId}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                error={errors.firstName}
                required
              />

              <FormInput
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                error={errors.lastName}
                required
              />
            </div>

            <FormSelect
              label="Grade Level"
              value={formData.gradeLevel}
              onChange={e => handleChange('gradeLevel', e.target.value)}
              error={errors.gradeLevel}
              required
            >
              <option value="">Select grade level</option>
              <option value="9">9th Grade</option>
              <option value="10">10th Grade</option>
              <option value="11">11th Grade</option>
              <option value="12">12th Grade</option>
            </FormSelect>

            <FormInput
              label="Email"
              type="email"
              placeholder="student@school.edu"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              error={errors.email}
            />

            <FormInput
              label="Phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              error={errors.phone}
            />
          </form>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Student' : 'Add Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
