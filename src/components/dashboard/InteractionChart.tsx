import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryBreakdown } from '@/types/dashboard';

interface InteractionChartProps {
  categoryBreakdown: CategoryBreakdown[];
}

// Default colors for categories if not specified - using logo color palette
const DEFAULT_COLORS = [
  '#4a90e2', // primary blue (logo)
  '#5ab76c', // success green (logo)
  '#3a7bc8', // darker blue
  '#87d797', // lighter green
  '#2e5c8a', // dark blue (logo)
  '#4a9659', // darker green
  '#75bde7', // lighter blue
  '#a5e1b1', // light green
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
                  <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100">
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
