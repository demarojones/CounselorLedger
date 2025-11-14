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
    
    // Transform mock data to match expected types
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

  const handleFormSubmit = async (data: any) => {
    // In a real app, this would call the API
    if (editingContact) {
      // Update existing contact
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? { ...c, ...data, updatedAt: new Date() }
            : c
        )
      );
    } else {
      // Create new contact
      const newContact: Contact = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setContacts((prev) => [...prev, newContact]);
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
      />

      <ContactForm
        contact={editingContact}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
