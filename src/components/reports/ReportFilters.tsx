import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormSelect } from '@/components/common/FormSelect';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import type { SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import { useAuth } from '@/contexts/AuthContext';
import type { ReportFilters as ReportFiltersType } from '@/types';
import type { Student } from '@/types/student';

interface ReportFiltersProps {
  filters: ReportFiltersType;
  onFiltersChange: (filters: ReportFiltersType) => void;
  categories: Array<{ id: string; name: string }>;
  counselors?: Array<{ id: string; firstName: string; lastName: string }>;
  students?: Student[];
  gradeLevels: string[];
}

const PRESET_OPTIONS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last Year', days: 365 },
];

export function ReportFilters({
  filters,
  onFiltersChange,
  categories,
  counselors,
  students = [],
  gradeLevels,
}: ReportFiltersProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [localFilters, setLocalFilters] = useState<ReportFiltersType>(filters);

  // Convert students to dropdown options
  const studentOptions: SearchableDropdownOption[] = students.map((student) => ({
    value: student.id,
    label: `${student.firstName} ${student.lastName}`,
    subtitle: `${student.studentId} - Grade ${student.gradeLevel}`,
  }));

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setLocalFilters({ ...localFilters, startDate: start, endDate: end });
  };

  const handleGradeLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalFilters({
      ...localFilters,
      gradeLevel: e.target.value || undefined,
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalFilters({
      ...localFilters,
      categoryId: e.target.value || undefined,
    });
  };

  const handleCounselorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalFilters({
      ...localFilters,
      counselorId: e.target.value || undefined,
    });
  };

  const handleRegardingStudentChange = (studentId: string) => {
    setLocalFilters({
      ...localFilters,
      regardingStudentId: studentId || undefined,
    });
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleResetFilters = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const resetFilters: ReportFiltersType = {
      startDate: start,
      endDate: end,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getActivePreset = (): number | null => {
    const now = new Date();
    const diffTime = now.getTime() - localFilters.startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isEndToday =
      localFilters.endDate.toDateString() === now.toDateString() ||
      Math.abs(localFilters.endDate.getTime() - now.getTime()) < 1000 * 60 * 60 * 24;

    if (!isEndToday) return null;

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
        <div className="space-y-6">
          {/* Date Range Presets */}
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
            <p className="text-sm text-muted-foreground mt-3">
              Showing data from <span className="font-medium">{formatDate(localFilters.startDate)}</span> to{' '}
              <span className="font-medium">{formatDate(localFilters.endDate)}</span>
            </p>
          </div>

          {/* Additional Filters */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-4">Additional Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Grade Level Filter */}
              <FormSelect
                label="Grade Level"
                value={localFilters.gradeLevel || ''}
                onChange={handleGradeLevelChange}
              >
                <option value="">All Grades</option>
                {gradeLevels.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </FormSelect>

              {/* Category Filter */}
              <FormSelect
                label="Interaction Type"
                value={localFilters.categoryId || ''}
                onChange={handleCategoryChange}
              >
                <option value="">All Types</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FormSelect>

              {/* Regarding Student Filter */}
              <SearchableDropdown
                label="Regarding Student"
                placeholder="Filter by student..."
                options={studentOptions}
                value={localFilters.regardingStudentId || ''}
                onChange={handleRegardingStudentChange}
                emptyMessage="No students found"
                helperText="Filter contact interactions by regarding student"
              />

              {/* Counselor Filter (Admin Only) */}
              {isAdmin && counselors && (
                <FormSelect
                  label="Counselor"
                  value={localFilters.counselorId || ''}
                  onChange={handleCounselorChange}
                >
                  <option value="">All Counselors</option>
                  {counselors.map((counselor) => (
                    <option key={counselor.id} value={counselor.id}>
                      {counselor.firstName} {counselor.lastName}
                    </option>
                  ))}
                </FormSelect>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-6 flex gap-3">
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
