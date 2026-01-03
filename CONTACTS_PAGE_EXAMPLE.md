# Contacts Page Integration Example

This shows how to update the `src/pages/Contacts.tsx` to use the new API layer.

## Before (Using Mock Data)

```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ContactList, ContactDetail, ContactForm } from '@/components/contacts';
import type { Contact } from '@/types/contact';
import type { Interaction } from '@/types/interaction';
import { getMockData } from '@/mocks/data/seedData';

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load mock data
  useEffect(() => {
    const mockData = getMockData();
    
    const transformedContacts: Contact[] = mockData.contacts.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    }));
    
    const transformedInteractions: Interaction[] = mockData.interactions.map((i: any) => ({
      ...i,
      startTime: new Date(i.startTime),
      endTime: new Date(i.endTime),
      followUpDate: i.followUpDate ? new Date(i.followUpDate) : undefined,
      createdAt: new Date(i.createdAt),
      updatedAt: new Date(i.updatedAt),
    }));
    
    setContacts(transformedContacts);
    setInteractions(transformedInteractions);
    setIsLoading(false);
  }, []);

  const handleFormSubmit = async (data: any) => {
    // In a real app, this would call the API
    if (editingContact) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? { ...c, ...data, updatedAt: new Date() }
            : c
        )
      );
    } else {
      const newContact: Contact = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setContacts((prev) => [...prev, newContact]);
    }
  };

  // ... rest of component
}
```

## After (Using Supabase API)

```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ContactList, ContactDetail, ContactForm } from '@/components/contacts';
import type { Contact } from '@/types/contact';
import type { Interaction } from '@/types/interaction';
import {
  fetchContacts,
  fetchInteractions,
  createContact,
  updateContact,
  deleteContact,
} from '@/services/api';
import { handleFormSubmission, prepareFormData } from '@/utils/formSubmission';

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [contactsResponse, interactionsResponse] = await Promise.all([
        fetchContacts(),
        fetchInteractions(),
      ]);

      if (contactsResponse.data) {
        setContacts(contactsResponse.data);
      }
      if (interactionsResponse.data) {
        setInteractions(interactionsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewContact = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setSelectedContact(contact);
      setIsDetailOpen(true);
    }
  };

  const handleEditContact = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setEditingContact(contact);
      setIsFormOpen(true);
      setIsDetailOpen(false);
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    // Validate and sanitize form data
    const { valid, data, errors } = prepareFormData(formData, [
      'firstName',
      'lastName',
      'relationship',
    ]);

    if (!valid) {
      setFormErrors(errors);
      return;
    }

    if (editingContact) {
      // Update existing contact
      const result = await handleFormSubmission(
        () => updateContact(editingContact.id, data),
        {
          successMessage: 'Contact updated successfully',
          onSuccess: (updatedContact) => {
            setContacts((prev) =>
              prev.map((c) =>
                c.id === editingContact.id ? updatedContact : c
              )
            );
            setIsFormOpen(false);
            setEditingContact(null);
            setFormErrors({});
          },
        }
      );
    } else {
      // Create new contact
      const result = await handleFormSubmission(
        () => createContact(data),
        {
          successMessage: 'Contact created successfully',
          onSuccess: (newContact) => {
            setContacts((prev) => [...prev, newContact]);
            setIsFormOpen(false);
            setFormErrors({});
          },
        }
      );
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    const result = await handleFormSubmission(
      () => deleteContact(contactId),
      {
        successMessage: 'Contact deleted successfully',
        onSuccess: () => {
          setContacts((prev) => prev.filter((c) => c.id !== contactId));
          setIsDetailOpen(false);
          setSelectedContact(null);
        },
      }
    );
  };

  const handleAddInteraction = () => {
    // This would navigate to the interaction form with the contact pre-selected
    console.log('Add interaction for contact:', selectedContact?.id);
    // TODO: Implement navigation to interaction form
  };

  const handleEditFromDetail = () => {
    if (selectedContact) {
      setEditingContact(selectedContact);
      setIsDetailOpen(false);
      setFormErrors({});
      setIsFormOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Manage external contacts and relationships.
          </p>
        </div>
        <Button onClick={handleAddContact} className="w-full sm:w-auto">
          Add Contact
        </Button>
      </div>

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
        onAddInteraction={handleAddInteraction}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteContact}
      />

      <ContactForm
        contact={editingContact}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        errors={formErrors}
      />
    </div>
  );
}
```

## Key Changes

### 1. Import API Functions
```typescript
import {
  fetchContacts,
  fetchInteractions,
  createContact,
  updateContact,
  deleteContact,
} from '@/services/api';
import { handleFormSubmission, prepareFormData } from '@/utils/formSubmission';
```

### 2. Load Data from Supabase
```typescript
useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  setIsLoading(true);
  try {
    const [contactsResponse, interactionsResponse] = await Promise.all([
      fetchContacts(),
      fetchInteractions(),
    ]);

    if (contactsResponse.data) {
      setContacts(contactsResponse.data);
    }
    if (interactionsResponse.data) {
      setInteractions(interactionsResponse.data);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Handle Form Submission
```typescript
const handleFormSubmit = async (formData: any) => {
  // Validate and sanitize
  const { valid, data, errors } = prepareFormData(formData, [
    'firstName',
    'lastName',
    'relationship',
  ]);

  if (!valid) {
    setFormErrors(errors);
    return;
  }

  if (editingContact) {
    // Update
    await handleFormSubmission(
      () => updateContact(editingContact.id, data),
      {
        successMessage: 'Contact updated successfully',
        onSuccess: (updatedContact) => {
          setContacts((prev) =>
            prev.map((c) =>
              c.id === editingContact.id ? updatedContact : c
            )
          );
          setIsFormOpen(false);
        },
      }
    );
  } else {
    // Create
    await handleFormSubmission(
      () => createContact(data),
      {
        successMessage: 'Contact created successfully',
        onSuccess: (newContact) => {
          setContacts((prev) => [...prev, newContact]);
          setIsFormOpen(false);
        },
      }
    );
  }
};
```

### 4. Add Delete Handler
```typescript
const handleDeleteContact = async (contactId: string) => {
  if (!confirm('Are you sure you want to delete this contact?')) {
    return;
  }

  await handleFormSubmission(
    () => deleteContact(contactId),
    {
      successMessage: 'Contact deleted successfully',
      onSuccess: () => {
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        setIsDetailOpen(false);
      },
    }
  );
};
```

## Benefits of This Approach

✅ **Real Supabase Integration**: Data is now persisted to Supabase
✅ **Automatic Error Handling**: Errors are caught and shown to users
✅ **Toast Notifications**: Success/error messages are shown automatically
✅ **Form Validation**: Data is validated before submission
✅ **Type Safety**: Full TypeScript support
✅ **Tenant Isolation**: Automatically uses current user's tenant
✅ **Works with Mock Data**: Can still use mock data by setting `VITE_USE_MOCK_DATA=true`

## Testing

1. **With Mock Data**: Set `VITE_USE_MOCK_DATA=true` in `.env.local`
2. **With Real Supabase**: Set `VITE_USE_MOCK_DATA=false` and configure Supabase credentials

The code works the same way in both modes!
