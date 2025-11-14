import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

type PresetOption = {
  label: string;
  days: number;
};

const PRESET_OPTIONS: PresetOption[] = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last Year', days: 365 },
];

export function DateRangeFilter({
  startDate,
  endDate,
  onDateRangeChange,
}: DateRangeFilterProps) {
  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onDateRangeChange(start, end);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Check which preset is currently active
  const getActivePreset = (): number | null => {
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if end date is today
    const isEndToday =
      endDate.toDateString() === now.toDateString() ||
      Math.abs(endDate.getTime() - now.getTime()) < 1000 * 60 * 60 * 24;

    if (!isEndToday) return null;

    // Find matching preset (with some tolerance)
    for (const preset of PRESET_OPTIONS) {
      if (Math.abs(diffDays - preset.days) <= 1) {
        return preset.days;
      }
    }

    return null;
  };

  const activePreset = getActivePreset();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Date Range</h3>
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.map((preset) => (
                <Button
                  key={preset.days}
                  variant={activePreset === preset.days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetClick(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing data from <span className="font-medium">{formatDate(startDate)}</span> to{' '}
              <span className="font-medium">{formatDate(endDate)}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
