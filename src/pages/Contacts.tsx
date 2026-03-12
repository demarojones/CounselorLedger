import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ContactList, ContactDetail, ContactForm } from '@/components/contacts';
import type { Contact } from '@/types/contact';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, useContactInteractions } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';

export function Contacts() {
  // Use React Query hooks
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: interactions = [], isLoading: interactionsLoading } = useInteractions();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch contact-specific interactions when a contact is selected
  const { data: contactInteractions = [] } = useContactInteractions(
    selectedContact?.id || ''
  );

  const isLoading = contactsLoading || interactionsLoading;

  const handleViewContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setSelectedContact(contact);
      setIsDetailOpen(true);
      // Contact interactions will be fetched automatically by useContactInteractions hook
    }
  };

  const handleEditContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      console.log('contact to be edited', contact);
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
    // Basic validation
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.relationship?.trim()) {
      setFormErrors({
        firstName: !formData.firstName?.trim() ? 'First name is required' : '',
        lastName: !formData.lastName?.trim() ? 'Last name is required' : '',
        relationship: !formData.relationship?.trim() ? 'Relationship is required' : '',
      });
      return;
    }

    try {
      if (editingContact) {
        // Update existing contact
        await updateContact.mutateAsync({
          id: editingContact.id,
          ...formData,
        });
        setIsFormOpen(false);
        setEditingContact(null);
        setFormErrors({});
      } else {
        // Create new contact
        await createContact.mutateAsync(formData);
        setIsFormOpen(false);
        setFormErrors({});
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      // Error toast is handled by the mutation hook
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await deleteContact.mutateAsync(contactId);
      setIsDetailOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
      // Error toast is handled by the mutation hook
    }
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
        interactions={contactInteractions}
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
