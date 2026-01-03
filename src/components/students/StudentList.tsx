import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types/student';
import type { Interaction } from '@/types/interaction';

interface StudentListProps {
  students: Student[];
  interactions: Interaction[];
  onStudentClick?: (studentId: string) => void;
  onEditStudent?: (student: Student) => void;
}

type SortField = 'name' | 'studentId' | 'gradeLevel' | 'interactionCount' | 'totalTimeSpent';
type SortDirection = 'asc' | 'desc';

export function StudentList({
  students,
  interactions,
  onStudentClick,
  onEditStudent,
}: StudentListProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate interaction stats for each student
  const studentsWithStats = useMemo(() => {
    return students.map(student => {
      const studentInteractions = interactions.filter(
        interaction => interaction.studentId === student.id
      );
      const interactionCount = studentInteractions.length;
      const totalTimeSpent = studentInteractions.reduce(
        (sum, interaction) => sum + interaction.durationMinutes,
        0
      );

      // Count pending follow-ups for this student
      const followUpCount = studentInteractions.filter(
        interaction =>
          interaction.needsFollowUp && !interaction.isFollowUpComplete && interaction.followUpDate
      ).length;

      return {
        ...student,
        interactionCount,
        totalTimeSpent,
        followUpCount,
      };
    });
  }, [students, interactions]);

  // Sort students
  const sortedStudents = useMemo(() => {
    const sorted = [...studentsWithStats].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = `${a.lastName} ${a.firstName}`.toLowerCase();
          bValue = `${b.lastName} ${b.firstName}`.toLowerCase();
          break;
        case 'studentId':
          aValue = a.studentId;
          bValue = b.studentId;
          break;
        case 'gradeLevel':
          aValue = a.gradeLevel;
          bValue = b.gradeLevel;
          break;
        case 'interactionCount':
          aValue = a.interactionCount || 0;
          bValue = b.interactionCount || 0;
          break;
        case 'totalTimeSpent':
          aValue = a.totalTimeSpent || 0;
          bValue = b.totalTimeSpent || 0;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [studentsWithStats, sortField, sortDirection]);

  // Paginate students
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedStudents.slice(startIndex, endIndex);
  }, [sortedStudents, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStudentClick = (studentId: string) => {
    if (onStudentClick) {
      onStudentClick(studentId);
    } else {
      navigate(`/students/${studentId}`);
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('studentId')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Student ID {getSortIcon('studentId')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Name {getSortIcon('name')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('gradeLevel')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Grade Level {getSortIcon('gradeLevel')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('interactionCount')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Interactions {getSortIcon('interactionCount')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('totalTimeSpent')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Time Spent {getSortIcon('totalTimeSpent')}
                </button>
              </TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              paginatedStudents.map(student => (
                <TableRow key={student.id} className="cursor-pointer">
                  <TableCell className="font-medium">{student.studentId}</TableCell>
                  <TableCell>
                    {student.lastName}, {student.firstName}
                  </TableCell>
                  <TableCell>{student.gradeLevel}</TableCell>
                  <TableCell>{student.interactionCount || 0}</TableCell>
                  <TableCell>{formatTime(student.totalTimeSpent || 0)}</TableCell>
                  <TableCell>
                    {student.followUpCount && student.followUpCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        {student.followUpCount} pending
                      </span>
                    ) : student.needsFollowUp ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Follow-up needed
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          if (onEditStudent) {
                            onEditStudent(student);
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStudentClick(student.id)}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedStudents.length)} of {sortedStudents.length}{' '}
            students
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
