import { useMemo } from 'react';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import type { SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import type { Contact } from '@/types/contact';

interface ContactSearchProps {
  contacts: Contact[];
  value?: string;
  onChange?: (contactId: string, contact: Contact | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ContactSearch({
  contacts,
  value,
  onChange,
  label = 'Contact',
  placeholder = 'Search contacts...',
  error,
  helperText,
  required = false,
  disabled = false,
  className,
}: ContactSearchProps) {
  // Convert contacts to dropdown options
  const options: SearchableDropdownOption[] = useMemo(() => {
    return contacts.map((contact) => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName}`,
      subtitle: `${contact.relationship}${contact.organization ? ` - ${contact.organization}` : ''}`,
      metadata: contact,
    }));
  }, [contacts]);

  // Custom filter function to search by name, relationship, and organization
  const filterFn = (option: SearchableDropdownOption, query: string) => {
    const lowerQuery = query.toLowerCase();
    const contact = option.metadata as Contact;
    
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const relationship = contact.relationship.toLowerCase();
    const organization = contact.organization?.toLowerCase() || '';
    
    return (
      fullName.includes(lowerQuery) ||
      relationship.includes(lowerQuery) ||
      organization.includes(lowerQuery)
    );
  };

  const handleChange = (contactId: string, option: SearchableDropdownOption | null) => {
    const contact = option?.metadata as Contact | null;
    onChange?.(contactId, contact || null);
  };

  return (
    <SearchableDropdown
      label={label}
      placeholder={placeholder}
      options={options}
      value={value}
      onChange={handleChange}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
      emptyMessage="No contacts found"
      filterFn={filterFn}
    />
  );
}
