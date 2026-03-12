import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchContacts,
  fetchContactInteractions,
  createContact as apiCreateContact,
  updateContact as apiUpdateContact,
  deleteContact as apiDeleteContact,
} from '@/services/api';
import { toast } from '@/utils/toast';
import { handleApiError } from '@/utils/errorHandling';
import { queryKeys } from '@/lib/queryClient';
import type { Contact } from '@/types/contact';

// Create contact
interface CreateContactData {
  firstName: string;
  lastName: string;
  relationship: string;
  organization?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

async function createContact(data: CreateContactData): Promise<Contact> {
  const response = await apiCreateContact(data);
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error('Failed to create contact');
  }
  return response.data;
}

// Update contact
interface UpdateContactData {
  id: string;
  firstName?: string;
  lastName?: string;
  relationship?: string;
  organization?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

async function updateContact(data: UpdateContactData): Promise<Contact> {
  const { id, ...updateFields } = data;
  const response = await apiUpdateContact(id, updateFields);
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error('Failed to update contact');
  }
  return response.data;
}

// Delete contact
async function deleteContact(id: string): Promise<void> {
  const response = await apiDeleteContact(id);
  if (response.error) {
    throw new Error(response.error.message);
  }
}

// Wrapper functions for the API
async function fetchContactsWrapper(): Promise<Contact[]> {
  const response = await fetchContacts();
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data || [];
}

async function fetchContactInteractionsWrapper(contactId: string) {
  const response = await fetchContactInteractions(contactId);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data || [];
}

/**
 * Hook to fetch all contacts for the current tenant
 * @returns {UseQueryResult<Contact[]>} React Query result with contacts array
 * @example
 * const { data: contacts, isLoading, error } = useContacts();
 */
export function useContacts() {
  return useQuery({
    queryKey: queryKeys.contacts,
    queryFn: fetchContactsWrapper,
  });
}

/**
 * Hook to fetch interactions for a specific contact
 * @param {string} contactId - The contact's unique identifier
 * @returns {UseQueryResult<Interaction[]>} React Query result with interactions array
 * @example
 * const { data: interactions, isLoading } = useContactInteractions(contactId);
 */
export function useContactInteractions(contactId: string) {
  return useQuery({
    queryKey: queryKeys.contactInteractions(contactId),
    queryFn: () => fetchContactInteractionsWrapper(contactId),
    enabled: !!contactId,
  });
}

/**
 * Hook to create a new contact with optimistic updates
 * @returns {UseMutationResult} React Query mutation with mutate function
 * @example
 * const createContact = useCreateContact();
 * createContact.mutate({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   relationship: 'Parent'
 * });
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onMutate: async newContactData => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts });

      // Snapshot previous value
      const previousContacts = queryClient.getQueryData<Contact[]>(queryKeys.contacts);

      // Optimistically add new contact to the list
      if (previousContacts) {
        const optimisticContact: Contact = {
          id: `temp-${Date.now()}`, // Temporary ID
          ...newContactData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData<Contact[]>(queryKeys.contacts, [
          ...previousContacts,
          optimisticContact,
        ]);
      }

      return { previousContacts };
    },
    onSuccess: (newContact, _, context) => {
      // Replace optimistic contact with real data from server
      const previousContacts = context?.previousContacts;

      if (previousContacts) {
        // Remove the optimistic entry and add the real one
        queryClient.setQueryData<Contact[]>(queryKeys.contacts, old => {
          if (!old) return [newContact];
          // Filter out any temp entries and add the real contact
          return [...old.filter(c => !c.id.startsWith('temp-')), newContact];
        });
      } else {
        // Fallback: just invalidate to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      }

      toast.success('Contact created successfully');
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        queryClient.setQueryData(queryKeys.contacts, context.previousContacts);
      }

      const apiError = handleApiError(error, { customMessage: 'Failed to create contact' });
      toast.error(apiError.message);
    },
  });
}

/**
 * Hook to update an existing contact with optimistic updates
 * @returns {UseMutationResult} React Query mutation with mutate function
 * @example
 * const updateContact = useUpdateContact();
 * updateContact.mutate({
 *   id: 'contact-uuid',
 *   email: 'newemail@example.com'
 * });
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContact,
    onMutate: async data => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts });

      // Snapshot previous value
      const previousContacts = queryClient.getQueryData<Contact[]>(queryKeys.contacts);

      // Optimistically update the contact in the list
      if (previousContacts) {
        queryClient.setQueryData<Contact[]>(
          queryKeys.contacts,
          previousContacts.map(contact =>
            contact.id === data.id ? { ...contact, ...data, updatedAt: new Date() } : contact
          )
        );
      }

      return { previousContacts };
    },
    onSuccess: updatedContact => {
      // Update cache with server response
      queryClient.setQueryData<Contact[]>(queryKeys.contacts, old => {
        if (!old) return [updatedContact];
        return old.map(contact => (contact.id === updatedContact.id ? updatedContact : contact));
      });

      // Invalidate contact interactions in case they need updating
      queryClient.invalidateQueries({
        queryKey: queryKeys.contactInteractions(updatedContact.id),
      });

      toast.success('Contact updated successfully');
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        queryClient.setQueryData(queryKeys.contacts, context.previousContacts);
      }

      const apiError = handleApiError(error, { customMessage: 'Failed to update contact' });
      toast.error(apiError.message);
    },
  });
}

/**
 * Hook to delete a contact with optimistic updates
 * @returns {UseMutationResult} React Query mutation with mutate function
 * @example
 * const deleteContact = useDeleteContact();
 * deleteContact.mutate('contact-uuid');
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,
    onMutate: async id => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts });

      // Snapshot previous value
      const previousContacts = queryClient.getQueryData<Contact[]>(queryKeys.contacts);

      // Optimistically remove from list
      if (previousContacts) {
        queryClient.setQueryData<Contact[]>(
          queryKeys.contacts,
          previousContacts.filter(c => c.id !== id)
        );
      }

      return { previousContacts };
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.contactInteractions(id) });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      queryClient.invalidateQueries({ queryKey: queryKeys.interactions });

      toast.success('Contact deleted successfully');
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        queryClient.setQueryData(queryKeys.contacts, context.previousContacts);
      }

      const apiError = handleApiError(error, { customMessage: 'Failed to delete contact' });
      toast.error(apiError.message);
    },
  });
}
