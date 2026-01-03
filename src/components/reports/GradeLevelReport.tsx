import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Interaction } from '@/types';

interface GradeLevelReportProps {
  interactions: Interaction[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function GradeLevelReport({ interactions }: GradeLevelReportProps) {
  const reportData = useMemo(() => {
    // Count interactions by grade level
    const gradeMap = new Map<string, number>();
    let totalInteractions = 0;

    interactions.forEach(interaction => {
      if (interaction.student) {
        const grade = interaction.student.gradeLevel;
        gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
        totalInteractions++;
      }
    });

    // Convert to array and calculate percentages
    const data = Array.from(gradeMap.entries())
      .map(([gradeLevel, count]) => ({
        gradeLevel,
        interactionCount: count,
        percentage: totalInteractions > 0 ? (count / totalInteractions) * 100 : 0,
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

    return data;
  }, [interactions]);

  const totalInteractions = useMemo(() => {
    return reportData.reduce((sum, item) => sum + item.interactionCount, 0);
  }, [reportData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Level Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Interaction count and percentage by grade level
        </p>
      </CardHeader>
      <CardContent>
        {reportData.length > 0 ? (
          <div className="space-y-6">
            {/* Bar Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gradeLevel" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'interactionCount') {
                      return [value, 'Interactions'];
                    }
                    return [value, name];
                  }}
                />
                <Bar dataKey="interactionCount" name="Interactions">
                  {reportData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Percentage Breakdown Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Grade Level</th>
                    <th className="text-right p-3 font-medium">Interactions</th>
                    <th className="text-right p-3 font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr key={item.gradeLevel} className="border-t">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">Grade {item.gradeLevel}</span>
                        </div>
                      </td>
                      <td className="text-right p-3">{item.interactionCount}</td>
                      <td className="text-right p-3">{item.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted font-medium">
                    <td className="p-3">Total</td>
                    <td className="text-right p-3">{totalInteractions}</td>
                    <td className="text-right p-3">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No grade level data available for the selected period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
