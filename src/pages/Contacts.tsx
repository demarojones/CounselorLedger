import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ContactList, ContactDetail, ContactForm } from '@/components/contacts';
import type { Contact } from '@/types/contact';
import type { Interaction } from '@/types/interaction';
import { fetchContacts, fetchInteractions, createContact, updateContact, deleteContact } from '@/services/api';
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

  // Load data from API
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
      await handleFormSubmission(
        () => updateContact(editingContact.id, data as any),
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
      await handleFormSubmission(
        () => createContact(data as any),
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

    await handleFormSubmission(
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
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Manage external contacts and relationships.</p>
        </div>
        <Button onClick={handleAddContact} className="w-full sm:w-auto">Add Contact</Button>
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
