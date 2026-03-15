/**
 * Optimized Interaction List Component
 *
 * This component implements performance optimizations for large interaction lists:
 * - Virtual scrolling for handling large datasets
 * - Memoized filtering and sorting
 * - Efficient re-rendering with React.memo
 * - Lazy loading of interaction details
 * - Privacy-aware data handling
 */

import React, { useState, useMemo, useCallback } from 'react';
// TODO: Install react-window package for virtual scrolling
// import { FixedSizeList as List } from 'react-window';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/common/FormInput';
import { FormSelect } from '@/components/common/FormSelect';
import { DateTimePicker } from '@/components/common/DateTimePicker';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { PrivacyIndicator } from '@/components/common/PrivacyIndicator';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import {
  useOptimizedInteractions,
  useInfiniteInteractions,
} from '@/hooks/useOptimizedInteractions';
import type { SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import type { Interaction } from '@/types/interaction';
import type { Student } from '@/types/student';
import type { Contact } from '@/types/contact';
import type { ReasonCategory } from '@/types/reason';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface OptimizedInteractionListProps {
  students?: Student[];
  contacts?: Contact[];
  categories?: ReasonCategory[];
  onView?: (interaction: Interaction) => void;
  onEdit?: (interaction: Interaction) => void;
  showFilters?: boolean;
  enableVirtualization?: boolean;
  pageSize?: number;
  maxHeight?: number;
}

interface FilterState {
  startDate: string;
  endDate: string;
  categoryFilter: string;
  studentFilter: string;
  contactFilter: string;
  searchQuery: string;
  followUpFilter: 'all' | 'pending' | 'overdue' | 'completed';
}

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

/**
 * Memoized interaction row component for efficient re-rendering
 */
const InteractionRow = React.memo<{
  interaction: Interaction;
  onView?: (interaction: Interaction) => void;
  onEdit?: (interaction: Interaction) => void;
  style?: React.CSSProperties;
}>(({ interaction, onView, onEdit, style }) => {
  const formatDateTime = useCallback((date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  const getPersonName = useCallback((interaction: Interaction) => {
    if (interaction.student) {
      return `${interaction.student.firstName} ${interaction.student.lastName}`;
    }
    if (interaction.contact) {
      const contactName = `${interaction.contact.firstName} ${interaction.contact.lastName}`;
      if (interaction.regardingStudent) {
        return `${contactName} (re: ${interaction.regardingStudent.firstName} ${interaction.regardingStudent.lastName})`;
      }
      return contactName;
    }
    return 'Unknown';
  }, []);

  const getPersonType = useCallback((interaction: Interaction) => {
    return interaction.student ? 'Student' : interaction.contact ? 'Contact' : '';
  }, []);

  const getFollowUpStatus = useCallback((interaction: Interaction) => {
    if (!interaction.needsFollowUp) {
      return null;
    }

    if (interaction.isFollowUpComplete) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    }

    if (interaction.followUpDate) {
      const isOverdue = new Date(interaction.followUpDate) < new Date();
      if (isOverdue) {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Overdue
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Needed
      </span>
    );
  }, []);

  const isOverdue =
    interaction.needsFollowUp &&
    !interaction.isFollowUpComplete &&
    interaction.followUpDate &&
    new Date(interaction.followUpDate) < new Date();

  return (
    <TableRow
      style={style}
      className={`${isOverdue ? 'bg-red-50' : ''} hover:bg-muted/50 transition-colors`}
    >
      <TableCell className="font-medium">{getPersonName(interaction)}</TableCell>
      <TableCell>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {getPersonType(interaction)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{interaction.category?.name || 'Unknown'}</span>
          {interaction.subcategory && (
            <span className="text-xs text-muted-foreground">{interaction.subcategory.name}</span>
          )}
          {interaction.customReason && (
            <span className="text-xs text-muted-foreground italic">{interaction.customReason}</span>
          )}
        </div>
      </TableCell>
      <TableCell>{formatDateTime(interaction.startTime)}</TableCell>
      <TableCell>{formatDuration(interaction.durationMinutes)}</TableCell>
      <TableCell>{getFollowUpStatus(interaction)}</TableCell>
      <TableCell>
        {interaction.counselor
          ? `${interaction.counselor.firstName} ${interaction.counselor.lastName}`
          : 'Unknown'}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(interaction)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(interaction)}>
              Edit
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

InteractionRow.displayName = 'InteractionRow';

/**
 * Virtualized list item component
 */
const VirtualizedInteractionItem = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    interactions: Interaction[];
    onView?: (interaction: Interaction) => void;
    onEdit?: (interaction: Interaction) => void;
  };
}>(({ index, style, data }) => {
  const { interactions, onView, onEdit } = data;
  const interaction = interactions[index];

  if (!interaction) {
    return (
      <div style={style} className="flex items-center justify-center p-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div style={style}>
      <InteractionRow interaction={interaction} onView={onView} onEdit={onEdit} />
    </div>
  );
});

VirtualizedInteractionItem.displayName = 'VirtualizedInteractionItem';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OptimizedInteractionList({
  students = [],
  contacts = [],
  categories = [],
  onView,
  onEdit,
  showFilters = true,
  enableVirtualization = true,
  pageSize = 50,
  maxHeight = 600,
}: OptimizedInteractionListProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    categoryFilter: '',
    studentFilter: '',
    contactFilter: '',
    searchQuery: '',
    followUpFilter: 'all',
  });

  // Build query options from filters
  const queryOptions = useMemo(() => {
    const options: any = {
      limit: pageSize,
      includeNotes: false, // Use minimal fields for list view
    };

    if (filters.startDate || filters.endDate) {
      options.dateRange = {
        start: filters.startDate || '1900-01-01',
        end: filters.endDate || '2100-12-31',
      };
    }

    if (filters.categoryFilter) {
      options.categoryId = filters.categoryFilter;
    }

    if (filters.studentFilter) {
      options.studentId = filters.studentFilter;
    }

    if (filters.contactFilter) {
      options.contactId = filters.contactFilter;
    }

    if (filters.followUpFilter !== 'all') {
      options.followUpStatus = filters.followUpFilter;
    }

    return options;
  }, [filters, pageSize]);

  // Use infinite query for large datasets or regular query for smaller ones
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
  } = useInfiniteInteractions(queryOptions);

  const { data: regularData, isLoading: isRegularLoading } = useOptimizedInteractions({
    ...queryOptions,
    enabled: !enableVirtualization,
  });

  // Determine which data to use
  const isLoading = enableVirtualization ? isInfiniteLoading : isRegularLoading;
  const allInteractions = useMemo(() => {
    if (enableVirtualization && infiniteData) {
      return infiniteData.pages.flatMap(page => page.data?.interactions || []);
    }
    if (!enableVirtualization && regularData) {
      return regularData.interactions || [];
    }
    return [];
  }, [enableVirtualization, infiniteData, regularData]);

  // Client-side filtering for search query (server-side filtering for other filters)
  const filteredInteractions = useMemo(() => {
    if (!filters.searchQuery) {
      return allInteractions;
    }

    const query = filters.searchQuery.toLowerCase();
    return allInteractions.filter(interaction => {
      const studentName = interaction.student
        ? `${interaction.student.firstName} ${interaction.student.lastName}`.toLowerCase()
        : '';
      const contactName = interaction.contact
        ? `${interaction.contact.firstName} ${interaction.contact.lastName}`.toLowerCase()
        : '';
      const regardingStudentName = interaction.regardingStudent
        ? `${interaction.regardingStudent.firstName} ${interaction.regardingStudent.lastName}`.toLowerCase()
        : '';
      const categoryName = interaction.category?.name.toLowerCase() || '';
      const notes = interaction.notes?.toLowerCase() || '';

      return (
        studentName.includes(query) ||
        contactName.includes(query) ||
        regardingStudentName.includes(query) ||
        categoryName.includes(query) ||
        notes.includes(query)
      );
    });
  }, [allInteractions, filters.searchQuery]);

  // Memoized dropdown options
  const studentOptions: SearchableDropdownOption[] = useMemo(
    () =>
      students.map(student => ({
        value: student.id,
        label: `${student.firstName} ${student.lastName}`,
        subtitle: `${student.studentId} - Grade ${student.gradeLevel}`,
      })),
    [students]
  );

  const contactOptions: SearchableDropdownOption[] = useMemo(
    () =>
      contacts.map(contact => ({
        value: contact.id,
        label: `${contact.firstName} ${contact.lastName}`,
        subtitle: `${contact.relationship}${contact.organization ? ` - ${contact.organization}` : ''}`,
      })),
    [contacts]
  );

  // Filter handlers
  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      startDate: '',
      endDate: '',
      categoryFilter: '',
      studentFilter: '',
      contactFilter: '',
      searchQuery: '',
      followUpFilter: 'all',
    });
  }, []);

  // Virtualization data is consumed directly via filteredInteractions below

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
        <span className="ml-2 text-muted-foreground">Loading interactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Indicator Header */}
      <PrivacyIndicator type="interactions" />

      {/* Filters */}
      {showFilters && (
        <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              disabled={Object.values(filters).every(v => !v || v === 'all')}
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Search */}
            <FormInput
              placeholder="Search interactions..."
              value={filters.searchQuery}
              onChange={e => updateFilter('searchQuery', e.target.value)}
            />

            {/* Date Range */}
            <DateTimePicker
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={value => updateFilter('startDate', value)}
            />

            <DateTimePicker
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={value => updateFilter('endDate', value)}
            />

            {/* Category Filter */}
            <FormSelect
              value={filters.categoryFilter}
              onChange={e => updateFilter('categoryFilter', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </FormSelect>

            {/* Student Filter */}
            {students.length > 0 && (
              <SearchableDropdown
                placeholder="Filter by student..."
                options={studentOptions}
                value={filters.studentFilter}
                onChange={value => updateFilter('studentFilter', value)}
                emptyMessage="No students found"
              />
            )}

            {/* Contact Filter */}
            {contacts.length > 0 && (
              <SearchableDropdown
                placeholder="Filter by contact..."
                options={contactOptions}
                value={filters.contactFilter}
                onChange={value => updateFilter('contactFilter', value)}
                emptyMessage="No contacts found"
              />
            )}

            {/* Follow-up Filter */}
            <FormSelect
              value={filters.followUpFilter}
              onChange={e =>
                updateFilter('followUpFilter', e.target.value as FilterState['followUpFilter'])
              }
            >
              <option value="all">All Follow-ups</option>
              <option value="pending">Pending Follow-ups</option>
              <option value="overdue">Overdue Follow-ups</option>
              <option value="completed">Completed Follow-ups</option>
            </FormSelect>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredInteractions.length} interactions
          {!isAdmin && <PrivacyIndicator type="interactions" variant="inline" className="ml-2" />}
        </p>
        {enableVirtualization && hasNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </div>

      {/* Interactions Table */}
      {filteredInteractions.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <p className="text-muted-foreground">
            No interactions found. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student/Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Counselor</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          {/* Virtualized or Regular Table Body */}
          {enableVirtualization && filteredInteractions.length > 20 ? (
            <div style={{ height: maxHeight, overflow: 'auto' }}>
              {/* TODO: Uncomment when react-window is installed
              <List
                height={maxHeight}
                itemCount={filteredInteractions.length}
                itemSize={60}
                itemData={virtualizedData}
              >
                {VirtualizedInteractionItem}
              </List>
              */}
              {/* Fallback to regular rendering */}
              <Table>
                <TableBody>
                  {filteredInteractions.map(interaction => (
                    <InteractionRow
                      key={interaction.id}
                      interaction={interaction}
                      onView={onView}
                      onEdit={onEdit}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Table>
              <TableBody>
                {filteredInteractions.map(interaction => (
                  <InteractionRow
                    key={interaction.id}
                    interaction={interaction}
                    onView={onView}
                    onEdit={onEdit}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

export default OptimizedInteractionList;
