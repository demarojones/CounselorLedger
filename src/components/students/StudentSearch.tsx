import { useNavigate } from 'react-router-dom';
import type { Student } from '@/types/student';
import type { SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';

interface StudentSearchProps {
  students: Student[];
  onStudentSelect?: (studentId: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function StudentSearch({
  students,
  onStudentSelect,
  placeholder = 'Search students...',
  label = 'Search Students',
  className,
}: StudentSearchProps) {
  const navigate = useNavigate();

  // Transform students to dropdown options
  const options: SearchableDropdownOption[] = students.map(student => ({
    value: student.id,
    label: `${student.lastName}, ${student.firstName}`,
    subtitle: `${student.studentId} • ${student.gradeLevel}`,
    metadata: {
      studentId: student.studentId,
      gradeLevel: student.gradeLevel,
    },
  }));

  const handleStudentSelect = (value: string, option: SearchableDropdownOption | null) => {
    if (option) {
      if (onStudentSelect) {
        onStudentSelect(value);
      } else {
        // Default behavior: navigate to student profile
        navigate(`/students/${value}`);
      }
    }
  };

  return (
    <SearchableDropdown
      label={label}
      placeholder={placeholder}
      options={options}
      onChange={handleStudentSelect}
      emptyMessage="No students found"
      className={className}
    />
  );
}
