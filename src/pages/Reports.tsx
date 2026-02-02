import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInteractions } from '@/hooks/useInteractions';
import { PageTransition } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ReportFilters,
  VolumeReport,
  FrequencyReport,
  GradeLevelReport,
  TimeAllocationReport,
} from '@/components/reports';
import { AdminReports } from '@/components/admin';
import type { ReportFilters as ReportFiltersType } from '@/types';

export function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Default to last 30 days
  const [filters, setFilters] = useState<ReportFiltersType>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate };
  });

  const { interactions, students, categories, isLoading, error } = useInteractions();

  // Get unique grade levels from students
  const gradeLevels = useMemo(() => {
    const grades = new Set(students.map(s => s.gradeLevel));
    return Array.from(grades).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    });
  }, [students]);

  // Filter interactions based on selected filters
  const filteredInteractions = useMemo(() => {
    return interactions.filter(interaction => {
      // Date range filter
      const interactionDate = new Date(interaction.startTime);
      if (interactionDate < filters.startDate || interactionDate > filters.endDate) {
        return false;
      }

      // Grade level filter
      if (filters.gradeLevel && interaction.student?.gradeLevel !== filters.gradeLevel) {
        return false;
      }

      // Category filter
      if (filters.categoryId && interaction.categoryId !== filters.categoryId) {
        return false;
      }

      // Regarding student filter
      if (filters.regardingStudentId && interaction.regardingStudentId !== filters.regardingStudentId) {
        return false;
      }

      // Counselor filter (admin only)
      if (filters.counselorId && interaction.counselorId !== filters.counselorId) {
        return false;
      }

      return true;
    });
  }, [interactions, filters]);

  const handleFiltersChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="page-container">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading reports...</div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <p className="text-destructive">Error loading reports: {error}</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Admin users see the AdminReports component
  if (isAdmin) {
    return (
      <PageTransition>
        <div className="page-container section-spacing">
          <div>
            <h1 className="heading-1">Reports</h1>
            <p className="mt-2 body-text-sm">
              Comprehensive analytics and reports across your organization
            </p>
          </div>

          <AdminReports />
        </div>
      </PageTransition>
    );
  }

  // Counselors see detailed report tabs
  return (
    <PageTransition>
      <div className="page-container section-spacing">
        <div>
          <h1 className="heading-1">Reports</h1>
          <p className="mt-2 body-text-sm">
            Generate and view comprehensive analytics and reports for your counseling activities
          </p>
        </div>

        {/* Filters */}
        <ReportFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          students={students}
          gradeLevels={gradeLevels}
        />

        {/* Report Tabs */}
        <Tabs defaultValue="volume" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="volume">Student Volume</TabsTrigger>
            <TabsTrigger value="frequency">Frequency</TabsTrigger>
            <TabsTrigger value="grade">Grade Level</TabsTrigger>
            <TabsTrigger value="time">Time Allocation</TabsTrigger>
          </TabsList>

          <TabsContent value="volume" className="space-y-6">
            <VolumeReport interactions={filteredInteractions} />
          </TabsContent>

          <TabsContent value="frequency" className="space-y-6">
            <FrequencyReport interactions={filteredInteractions} />
          </TabsContent>

          <TabsContent value="grade" className="space-y-6">
            <GradeLevelReport interactions={filteredInteractions} />
          </TabsContent>

          <TabsContent value="time" className="space-y-6">
            <TimeAllocationReport interactions={filteredInteractions} />
          </TabsContent>
        </Tabs>

        {/* No data message */}
        {filteredInteractions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No interactions found for the selected filters. Try adjusting your date range or filters.
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
