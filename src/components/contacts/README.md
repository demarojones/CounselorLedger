# Contact Management Components

This directory contains all components related to contact management functionality.

## Components

### ContactList
A comprehensive table view for displaying contacts with sorting, filtering, and pagination.

**Features:**
- Displays contact information: name, relationship, email, phone, organization, interaction count
- Sortable columns (click column headers to sort)
- Real-time filtering by name, relationship, email, phone, or organization
- Pagination for large datasets (20 items per page)
- View and Edit action buttons for each contact

**Props:**
- `contacts`: Array of Contact objects
- `interactions`: Array of Interaction objects (used to calculate interaction counts)
- `onViewContact`: Callback when View button is clicked
- `onEditContact`: Callback when Edit button is clicked

### ContactDetail
A modal dialog that displays detailed information about a contact and their interaction history.

**Features:**
- Shows full contact information (email, phone, organization, notes)
- Displays total interaction count
- Shows recent interactions (last 5) with date, time, duration, and notes
- "Add Interaction" button to create new interaction with this contact
- "Edit" button to open the contact form

**Props:**
- `contact`: Contact object to display (or null)
- `interactions`: Array of all interactions
- `open`: Boolean to control modal visibility
- `onOpenChange`: Callback when modal is opened/closed
- `onAddInteraction`: Callback when Add Interaction button is clicked
- `onEdit`: Callback when Edit button is clicked

### ContactForm
A modal form for creating new contacts or editing existing ones.

**Features:**
- Form fields: first name, last name, relationship, email, phone, organization, notes
- Validation for required fields (first name, last name, relationship)
- Email format validation
- Success/error feedback messages
- Auto-closes after successful submission
- Disabled state during submission

**Props:**
- `contact`: Contact object to edit (null for create mode)
- `open`: Boolean to control modal visibility
- `onOpenChange`: Callback when modal is opened/closed
- `onSubmit`: Async callback with form data when form is submitted

**Form Data:**
```typescript
{
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  organization: string;
  notes: string;
}
```

### ContactSearch
A searchable dropdown component for finding and selecting contacts.

**Features:**
- Real-time filtering as user types
- Searches by name, relationship, and organization
- Displays contact name with relationship and organization as subtitle
- Keyboard navigation support (arrow keys, enter, escape)
- Empty state message when no results found

**Props:**
- `contacts`: Array of Contact objects
- `value`: Selected contact ID
- `onChange`: Callback with contact ID and Contact object when selection changes
- `label`: Label for the dropdown
- `placeholder`: Placeholder text
- `error`: Error message to display
- `helperText`: Helper text below the dropdown
- `required`: Whether the field is required
- `disabled`: Whether the dropdown is disabled
- `className`: Additional CSS classes

## Usage Example

```tsx
import { useState } from 'react';
import { ContactList, ContactDetail, ContactForm, ContactSearch } from '@/components/contacts';

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleViewContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    setSelectedContact(contact || null);
    setIsDetailOpen(true);
  };

  const handleEditContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    setSelectedContact(contact || null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    // Save contact via API
    await saveContact(data);
  };

  return (
    <div>
      <ContactList
        contacts={contacts}
        interactions={interactions}
        onViewContact={handleViewContact}
        onEditContact={handleEditContact}
      />

      <ContactDetail
        contact={selectedContact}
        interactions={interactions}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onAddInteraction={() => {/* Navigate to interaction form */}}
        onEdit={() => setIsFormOpen(true)}
      />

      <ContactForm
        contact={selectedContact}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
```

## Relationship Types

The following relationship types are available:
- Parent
- Guardian
- Teacher
- Administrator
- Counselor
- Social Worker
- Other

## Requirements Satisfied

This implementation satisfies Requirement 5 from the requirements document:

**5.1** - Contact list view with table display showing name, relationship, email, phone, organization, and interaction counts with sorting and filtering

**5.2** - Contact detail modal showing full contact information and interaction history with interaction count and recent interactions

**5.3** - Contact form for creating and editing contacts with validation for required fields and success/error feedback

**5.5** - Contact search functionality with searchable dropdown filtering by name, relationship, or organization
