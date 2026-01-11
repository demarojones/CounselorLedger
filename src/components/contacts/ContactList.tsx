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
import { Input } from '@/components/ui/input';
import type { Contact } from '@/types/contact';
import type { Interaction } from '@/types/interaction';

interface ContactListProps {
  contacts: Contact[];
  interactions: Interaction[];
  onViewContact?: (contactId: string) => void;
  onEditContact?: (contactId: string) => void;
}

type SortField = 'name' | 'relationship' | 'email' | 'phone' | 'organization' | 'interactionCount';
type SortDirection = 'asc' | 'desc';

export function ContactList({
  contacts,
  interactions,
  onViewContact,
  onEditContact,
}: ContactListProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterQuery, setFilterQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate interaction stats for each contact
  const contactsWithStats = useMemo(() => {
    return contacts.map(contact => {
      const contactInteractions = interactions.filter(
        interaction => interaction.contactId === contact.id
      );
      const interactionCount = contactInteractions.length;

      return {
        ...contact,
        interactionCount,
      };
    });
  }, [contacts, interactions]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    if (!filterQuery) return contactsWithStats;

    const lowerQuery = filterQuery.toLowerCase();
    return contactsWithStats.filter(contact => {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const relationship = contact.relationship.toLowerCase();
      const email = contact.email?.toLowerCase() || '';
      const phone = contact.phone?.toLowerCase() || '';
      const organization = contact.organization?.toLowerCase() || '';

      return (
        fullName.includes(lowerQuery) ||
        relationship.includes(lowerQuery) ||
        email.includes(lowerQuery) ||
        phone.includes(lowerQuery) ||
        organization.includes(lowerQuery)
      );
    });
  }, [contactsWithStats, filterQuery]);

  // Sort contacts
  const sortedContacts = useMemo(() => {
    const sorted = [...filteredContacts].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = `${a.lastName} ${a.firstName}`.toLowerCase();
          bValue = `${b.lastName} ${b.firstName}`.toLowerCase();
          break;
        case 'relationship':
          aValue = a.relationship.toLowerCase();
          bValue = b.relationship.toLowerCase();
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'organization':
          aValue = a.organization?.toLowerCase() || '';
          bValue = b.organization?.toLowerCase() || '';
          break;
        case 'interactionCount':
          aValue = a.interactionCount || 0;
          bValue = b.interactionCount || 0;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredContacts, sortField, sortDirection]);

  // Paginate contacts
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedContacts.slice(startIndex, endIndex);
  }, [sortedContacts, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="space-y-4">
      {/* Privacy indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-blue-800">
            Interaction counts show your private interactions only
          </span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          Other counselors' interactions with these contacts are not visible to maintain privacy
        </p>
      </div>

      {/* Filter Input */}
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Filter by name, relationship, email, phone, or organization..."
          value={filterQuery}
          onChange={e => {
            setFilterQuery(e.target.value);
            setCurrentPage(1); // Reset to first page on filter
          }}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Name {getSortIcon('name')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('relationship')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Relationship {getSortIcon('relationship')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Email {getSortIcon('email')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('phone')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Phone {getSortIcon('phone')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('organization')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Organization {getSortIcon('organization')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('interactionCount')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Your Interactions {getSortIcon('interactionCount')}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {filterQuery ? 'No contacts match your filter' : 'No contacts found'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    {contact.lastName}, {contact.firstName}
                  </TableCell>
                  <TableCell>{contact.relationship}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>{contact.phone || '-'}</TableCell>
                  <TableCell>{contact.organization || '-'}</TableCell>
                  <TableCell>{contact.interactionCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onViewContact?.(contact.id)}>
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEditContact?.(contact.id)}>
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedContacts.length)} of {sortedContacts.length}{' '}
            contacts
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
