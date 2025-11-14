import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Interaction } from '@/types';

interface TimeAllocationReportProps {
  interactions: Interaction[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function TimeAllocationReport({ interactions }: TimeAllocationReportProps) {
  const reportData = useMemo(() => {
    let totalMinutes = 0;

    // Time by category
    const categoryMap = new Map<string, number>();
    interactions.forEach((interaction) => {
      if (interaction.category) {
        const categoryName = interaction.category.name;
        categoryMap.set(
          categoryName,
          (categoryMap.get(categoryName) || 0) + interaction.durationMinutes
        );
        totalMinutes += interaction.durationMinutes;
      }
    });

    const byCategory = Array.from(categoryMap.entries())
      .map(([categoryName, totalMinutes]) => ({
        categoryName,
        totalMinutes,
        percentage: totalMinutes > 0 ? (totalMinutes / totalMinutes) * 100 : 0,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Recalculate percentages based on total
    const categoryTotal = byCategory.reduce((sum, item) => sum + item.totalMinutes, 0);
    byCategory.forEach((item) => {
      item.percentage = categoryTotal > 0 ? (item.totalMinutes / categoryTotal) * 100 : 0;
    });

    // Time by grade level
    const gradeMap = new Map<string, number>();
    interactions.forEach((interaction) => {
      if (interaction.student) {
        const grade = interaction.student.gradeLevel;
        gradeMap.set(grade, (gradeMap.get(grade) || 0) + interaction.durationMinutes);
      }
    });

    const byGradeLevel = Array.from(gradeMap.entries())
      .map(([gradeLevel, totalMinutes]) => ({
        gradeLevel,
        totalMinutes,
        percentage: 0,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.gradeLevel);
        const bNum = parseInt(b.gradeLevel);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.gradeLevel.localeCompare(b.gradeLevel);
      });

    const gradeTotal = byGradeLevel.reduce((sum, item) => sum + item.totalMinutes, 0);
    byGradeLevel.forEach((item) => {
      item.percentage = gradeTotal > 0 ? (item.totalMinutes / gradeTotal) * 100 : 0;
    });

    // Time by student (top 20)
    const studentMap = new Map<string, { studentName: string; totalMinutes: number }>();
    interactions.forEach((interaction) => {
      if (interaction.student && interaction.studentId) {
        const existing = studentMap.get(interaction.studentId);
        const studentName = `${interaction.student.firstName} ${interaction.student.lastName}`;
        if (existing) {
          existing.totalMinutes += interaction.durationMinutes;
        } else {
          studentMap.set(interaction.studentId, {
            studentName,
            totalMinutes: interaction.durationMinutes,
          });
        }
      }
    });

    const byStudent = Array.from(studentMap.entries())
      .map(([studentId, data]) => ({
        studentId,
        studentName: data.studentName,
        totalMinutes: data.totalMinutes,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 20);

    return {
      byCategory,
      byGradeLevel,
      byStudent,
      totalMinutes,
    };
  }, [interactions]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Time by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Time Allocation by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.byCategory.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.byCategory}
                    dataKey="totalMinutes"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${((entry.percent || 0) * 100).toFixed(0)}%`}
                  >
                    {reportData.byCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatTime(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {reportData.byCategory.map((item, index) => (
                  <div key={item.categoryName} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatTime(item.totalMinutes)}</div>
                      <div className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No category data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Time by Grade Level */}
      <Card>
        <CardHeader>
          <CardTitle>Time Allocation by Grade Level</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.byGradeLevel.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Grade Level</th>
                    <th className="text-right p-3 font-medium">Total Time</th>
                    <th className="text-right p-3 font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.byGradeLevel.map((item) => (
                    <tr key={item.gradeLevel} className="border-t">
                      <td className="p-3 font-medium">Grade {item.gradeLevel}</td>
                      <td className="text-right p-3">{formatTime(item.totalMinutes)}</td>
                      <td className="text-right p-3">{item.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No grade level data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Time by Student (Top 20) */}
      <Card>
        <CardHeader>
          <CardTitle>Time Allocation by Student (Top 20)</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.byStudent.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Student Name</th>
                    <th className="text-right p-3 font-medium">Total Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.byStudent.map((item, index) => (
                    <tr key={item.studentId} className="border-t">
                      <td className="p-3 text-muted-foreground">{index + 1}</td>
                      <td className="p-3 font-medium">{item.studentName}</td>
                      <td className="text-right p-3">{formatTime(item.totalMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No student data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
