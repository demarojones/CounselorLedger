import { useState, useMemo } from 'react';
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
import type { SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import type { Interaction } from '@/types/interaction';
import type { Student } from '@/types/student';
import type { Contact } from '@/types/contact';
import type { ReasonCategory } from '@/types/reason';

export interface InteractionListProps {
  interactions: Interaction[];
  students?: Student[];
  contacts?: Contact[];
  categories?: ReasonCategory[];
  onView?: (interaction: Interaction) => void;
  onEdit?: (interaction: Interaction) => void;
  showFilters?: boolean;
  isLoading?: boolean;
}

export function InteractionList({
  interactions,
  students = [],
  contacts = [],
  categories = [],
  onView,
  onEdit,
  showFilters = true,
  isLoading = false,
}: InteractionListProps) {
  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');

  // Student/Contact dropdown options
  const studentOptions: SearchableDropdownOption[] = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: `${student.firstName} ${student.lastName}`,
        subtitle: `${student.studentId} - Grade ${student.gradeLevel}`,
      })),
    [students]
  );

  const contactOptions: SearchableDropdownOption[] = useMemo(
    () =>
      contacts.map((contact) => ({
        value: contact.id,
        label: `${contact.firstName} ${contact.lastName}`,
        subtitle: `${contact.relationship}${contact.organization ? ` - ${contact.organization}` : ''}`,
      })),
    [contacts]
  );

  // Filter interactions
  const filteredInteractions = useMemo(() => {
    let filtered = [...interactions];

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(
        (interaction) => new Date(interaction.startTime) >= start
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter(
        (interaction) => new Date(interaction.startTime) <= end
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        (interaction) => interaction.categoryId === categoryFilter
      );
    }

    // Student filter
    if (studentFilter) {
      filtered = filtered.filter(
        (interaction) => interaction.studentId === studentFilter
      );
    }

    // Contact filter
    if (contactFilter) {
      filtered = filtered.filter(
        (interaction) => interaction.contactId === contactFilter
      );
    }

    // Search query (searches in notes)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((interaction) => {
        const studentName = interaction.student
          ? `${interaction.student.firstName} ${interaction.student.lastName}`.toLowerCase()
          : '';
        const contactName = interaction.contact
          ? `${interaction.contact.firstName} ${interaction.contact.lastName}`.toLowerCase()
          : '';
        const categoryName = interaction.category?.name.toLowerCase() || '';
        const notes = interaction.notes?.toLowerCase() || '';

        return (
          studentName.includes(query) ||
          contactName.includes(query) ||
          categoryName.includes(query) ||
          notes.includes(query)
        );
      });
    }

    // Follow-up filter
    if (followUpFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((interaction) => {
        if (followUpFilter === 'pending') {
          return (
            interaction.needsFollowUp &&
            !interaction.isFollowUpComplete &&
            interaction.followUpDate
          );
        }
        if (followUpFilter === 'overdue') {
          return (
            interaction.needsFollowUp &&
            !interaction.isFollowUpComplete &&
            interaction.followUpDate &&
            new Date(interaction.followUpDate) < now
          );
        }
        if (followUpFilter === 'completed') {
          return interaction.isFollowUpComplete;
        }
        return true;
      });
    }

    // Sort by most recent first
    filtered.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    return filtered;
  }, [
    interactions,
    startDate,
    endDate,
    categoryFilter,
    studentFilter,
    contactFilter,
    searchQuery,
    followUpFilter,
  ]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategoryFilter('');
    setStudentFilter('');
    setContactFilter('');
    setSearchQuery('');
    setFollowUpFilter('all');
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPersonName = (interaction: Interaction) => {
    if (interaction.student) {
      return `${interaction.student.firstName} ${interaction.student.lastName}`;
    }
    if (interaction.contact) {
      return `${interaction.contact.firstName} ${interaction.contact.lastName}`;
    }
    return 'Unknown';
  };

  const getPersonType = (interaction: Interaction) => {
    if (interaction.student) {
      return 'Student';
    }
    if (interaction.contact) {
      return 'Contact';
    }
    return '';
  };

  const getFollowUpStatus = (interaction: Interaction) => {
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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading interactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              disabled={
                !startDate &&
                !endDate &&
                !categoryFilter &&
                !studentFilter &&
                !contactFilter &&
                !searchQuery &&
                followUpFilter === 'all'
              }
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Search */}
            <FormInput
              placeholder="Search interactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Date Range */}
            <DateTimePicker
              label="Start Date"
              type="date"
              value={startDate}
              onChange={setStartDate}
            />

            <DateTimePicker
              label="End Date"
              type="date"
              value={endDate}
              onChange={setEndDate}
            />

            {/* Category Filter */}
            <div className="space-y-2">
              <FormSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* Student Filter */}
            {students.length > 0 && (
              <SearchableDropdown
                placeholder="Filter by student..."
                options={studentOptions}
                value={studentFilter}
                onChange={(value) => setStudentFilter(value)}
                emptyMessage="No students found"
              />
            )}

            {/* Contact Filter */}
            {contacts.length > 0 && (
              <SearchableDropdown
                placeholder="Filter by contact..."
                options={contactOptions}
                value={contactFilter}
                onChange={(value) => setContactFilter(value)}
                emptyMessage="No contacts found"
              />
            )}

            {/* Follow-up Filter */}
            <div className="space-y-2">
              <FormSelect
                value={followUpFilter}
                onChange={(e) => setFollowUpFilter(e.target.value as 'all' | 'pending' | 'overdue' | 'completed')}
              >
                <option value="all">All Follow-ups</option>
                <option value="pending">Pending Follow-ups</option>
                <option value="overdue">Overdue Follow-ups</option>
                <option value="completed">Completed Follow-ups</option>
              </FormSelect>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredInteractions.length} of {interactions.length}{' '}
          interactions
        </p>
      </div>

      {/* Interactions Table */}
      {filteredInteractions.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <p className="text-muted-foreground">
            {interactions.length === 0
              ? 'No interactions found. Create your first interaction to get started.'
              : 'No interactions match your filters. Try adjusting your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
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
            <TableBody>
              {filteredInteractions.map((interaction) => {
                const isOverdue =
                  interaction.needsFollowUp &&
                  !interaction.isFollowUpComplete &&
                  interaction.followUpDate &&
                  new Date(interaction.followUpDate) < new Date();

                return (
                <TableRow 
                  key={interaction.id}
                  className={isOverdue ? 'bg-red-50' : ''}
                >
                  <TableCell className="font-medium">
                    {getPersonName(interaction)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getPersonType(interaction)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {interaction.category?.name || 'Unknown'}
                      </span>
                      {interaction.subcategory && (
                        <span className="text-xs text-muted-foreground">
                          {interaction.subcategory.name}
                        </span>
                      )}
                      {interaction.customReason && (
                        <span className="text-xs text-muted-foreground italic">
                          {interaction.customReason}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(interaction.startTime)}
                  </TableCell>
                  <TableCell>
                    {formatDuration(interaction.durationMinutes)}
                  </TableCell>
                  <TableCell>
                    {getFollowUpStatus(interaction)}
                  </TableCell>
                  <TableCell>
                    {interaction.counselor
                      ? `${interaction.counselor.firstName} ${interaction.counselor.lastName}`
                      : 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(interaction)}
                        >
                          View
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(interaction)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
