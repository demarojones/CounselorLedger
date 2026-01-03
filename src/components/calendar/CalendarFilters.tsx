import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ReasonCategory } from '@/types/reason';

export interface CalendarFiltersProps {
  categories: ReasonCategory[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearFilters: () => void;
  view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  onViewChange: (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => void;
  onToday: () => void;
}

export function CalendarFilters({
  categories,
  selectedCategories,
  onCategoryToggle,
  onClearFilters,
  view,
  onViewChange,
  onToday,
}: CalendarFiltersProps) {
  const allSelected = selectedCategories.length === 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* View Controls */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">View</Label>
        <div className="flex gap-2">
          <Button
            variant={view === 'dayGridMonth' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('dayGridMonth')}
          >
            Month
          </Button>
          <Button
            variant={view === 'timeGridWeek' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('timeGridWeek')}
          >
            Week
          </Button>
          <Button
            variant={view === 'timeGridDay' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('timeGridDay')}
          >
            Day
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Filter by Category</Label>
          {!allSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {categories.map(category => {
            const isSelected = allSelected || selectedCategories.includes(category.id);

            return (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onCategoryToggle(category.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{
                      backgroundColor: category.color || '#6b7280',
                    }}
                  />
                  <span className="text-sm">{category.name}</span>
                </div>
              </label>
            );
          })}
        </div>

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories available</p>
        )}
      </div>
    </div>
  );
}
