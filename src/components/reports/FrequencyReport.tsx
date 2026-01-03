import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import type { Interaction } from '@/types';

interface FrequencyReportProps {
  interactions: Interaction[];
}

type SortField = 'studentName' | 'gradeLevel' | 'interactionCount' | 'totalTimeSpent';
type SortDirection = 'asc' | 'desc';

export function FrequencyReport({ interactions }: FrequencyReportProps) {
  const [sortField, setSortField] = useState<SortField>('interactionCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const reportData = useMemo(() => {
    // Group interactions by student
    const studentMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        gradeLevel: string;
        interactionCount: number;
        totalTimeSpent: number;
      }
    >();

    interactions.forEach(interaction => {
      if (interaction.student && interaction.studentId) {
        const existing = studentMap.get(interaction.studentId);
        if (existing) {
          existing.interactionCount++;
          existing.totalTimeSpent += interaction.durationMinutes;
        } else {
          studentMap.set(interaction.studentId, {
            studentId: interaction.studentId,
            studentName: `${interaction.student.firstName} ${interaction.student.lastName}`,
            gradeLevel: interaction.student.gradeLevel,
            interactionCount: 1,
            totalTimeSpent: interaction.durationMinutes,
          });
        }
      }
    });

    return Array.from(studentMap.values());
  }, [interactions]);

  const sortedData = useMemo(() => {
    const sorted = [...reportData];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'studentName':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'gradeLevel':
          comparison = a.gradeLevel.localeCompare(b.gradeLevel);
          break;
        case 'interactionCount':
          comparison = a.interactionCount - b.interactionCount;
          break;
        case 'totalTimeSpent':
          comparison = a.totalTimeSpent - b.totalTimeSpent;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [reportData, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return '↕';
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interaction Frequency by Student</CardTitle>
        <p className="text-sm text-muted-foreground">Students ranked by number of interactions</p>
      </CardHeader>
      <CardContent>
        {sortedData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th className="text-left">#</th>
                  <th
                    className="text-left cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('studentName')}
                  >
                    Student Name {getSortIcon('studentName')}
                  </th>
                  <th
                    className="text-left cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('gradeLevel')}
                  >
                    Grade {getSortIcon('gradeLevel')}
                  </th>
                  <th
                    className="text-right cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('interactionCount')}
                  >
                    Interactions {getSortIcon('interactionCount')}
                  </th>
                  <th
                    className="text-right cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('totalTimeSpent')}
                  >
                    Total Time {getSortIcon('totalTimeSpent')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((student, index) => (
                  <tr key={student.studentId}>
                    <td className="text-muted-foreground">{index + 1}</td>
                    <td className="font-medium">{student.studentName}</td>
                    <td>{student.gradeLevel}</td>
                    <td className="text-right">{student.interactionCount}</td>
                    <td className="text-right">{formatTime(student.totalTimeSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No interaction data available for the selected period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
