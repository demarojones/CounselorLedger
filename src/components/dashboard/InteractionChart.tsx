import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryBreakdown } from '@/types/dashboard';

interface InteractionChartProps {
  categoryBreakdown: CategoryBreakdown[];
}

// Default colors for categories if not specified
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function InteractionChart({ categoryBreakdown }: InteractionChartProps) {
  // If no data, show empty state
  if (categoryBreakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interaction Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No interaction data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total for percentage display
  const total = categoryBreakdown.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interaction Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple bar chart representation */}
          <div className="space-y-3">
            {categoryBreakdown.map((category, index) => {
              const color = category.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
              const percentage = total > 0 ? (category.count / total) * 100 : 0;

              return (
                <div key={category.categoryName} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-medium">{category.categoryName}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {category.count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm font-medium">
              <span>Total Interactions</span>
              <span>{total}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
