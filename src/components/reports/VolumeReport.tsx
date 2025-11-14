import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { exportToCSV, exportToPDF } from '@/utils/exportHelpers';
import type { Interaction } from '@/types';

interface VolumeReportProps {
  interactions: Interaction[];
}

export function VolumeReport({ interactions }: VolumeReportProps) {
  const reportData = useMemo(() => {
    // Get unique students
    const uniqueStudentIds = new Set(
      interactions
        .filter((i) => i.studentId)
        .map((i) => i.studentId as string)
    );

    const totalStudents = uniqueStudentIds.size;

    // Breakdown by grade level
    const gradeMap = new Map<string, Set<string>>();
    interactions.forEach((interaction) => {
      if (interaction.student && interaction.studentId) {
        const grade = interaction.student.gradeLevel;
        if (!gradeMap.has(grade)) {
          gradeMap.set(grade, new Set());
        }
        gradeMap.get(grade)!.add(interaction.studentId);
      }
    });

    const byGradeLevel = Array.from(gradeMap.entries())
      .map(([gradeLevel, studentIds]) => ({
        gradeLevel,
        count: studentIds.size,
      }))
      .sort((a, b) => {
        // Sort grades numerically if possible
        const aNum = parseInt(a.gradeLevel);
        const bNum = parseInt(b.gradeLevel);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.gradeLevel.localeCompare(b.gradeLevel);
      });

    // Trend over time (group by week)
    const trendMap = new Map<string, Set<string>>();
    interactions.forEach((interaction) => {
      if (interaction.student && interaction.studentId) {
        const date = new Date(interaction.startTime);
        // Get start of week (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!trendMap.has(weekKey)) {
          trendMap.set(weekKey, new Set());
        }
        trendMap.get(weekKey)!.add(interaction.studentId);
      }
    });

    const trend = Array.from(trendMap.entries())
      .map(([dateStr, studentIds]) => ({
        date: new Date(dateStr),
        count: studentIds.size,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      totalStudents,
      byGradeLevel,
      trend,
    };
  }, [interactions]);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const handleExportCSV = () => {
    const csvData = [
      {
        metric: 'Total Unique Students',
        value: reportData.totalStudents,
      },
      ...reportData.byGradeLevel.map((item) => ({
        metric: `Grade ${item.gradeLevel}`,
        value: item.count,
      })),
    ];
    exportToCSV(csvData, 'student-volume-report', ['metric', 'value']);
  };

  const handleExportPDF = () => {
    exportToPDF('volume-report-content', 'student-volume-report');
  };

  return (
    <div id="volume-report-content" className="space-y-6">
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          Export PDF
        </Button>
      </div>
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Student Volume Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-5xl font-bold text-primary">
              {reportData.totalStudents}
            </div>
            <p className="text-muted-foreground mt-2">
              Unique Students Seen
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grade Level Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Students by Grade Level</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.byGradeLevel.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.byGradeLevel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gradeLevel" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Students" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {reportData.byGradeLevel.map((item) => (
                  <div key={item.gradeLevel} className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{item.count}</div>
                    <div className="text-sm text-muted-foreground">Grade {item.gradeLevel}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No student data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trend Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Student Volume Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => formatDate(date)}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={(date) => formatDate(date as Date)}
                  formatter={(value: number) => [value, 'Students']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Students"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No trend data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
