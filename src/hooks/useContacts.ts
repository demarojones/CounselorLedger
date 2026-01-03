import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { toast } from '@/utils/toast';
import { handleApiError } from '@/utils/errorHandling';
import { queryKeys } from '@/lib/queryClient';
import type { Contact, ContactDbResponse } from '@/types/contact';

// Helper function to convert snake_case DB response to camelCase
function convertContactFromDb(dbContact: ContactDbResponse): Contact {
  return {
    id: dbContact.id,
    firstName: dbContact.first_name,
    lastName: dbContact.last_name,
    relationship: dbContact.relationship,
    email: dbContact.email,
    phone: dbContact.phone,
    organization: dbContact.organization,
    notes: dbContact.notes,
    createdAt: new Date(dbContact.created_at),
    updatedAt: new Date(dbContact.updated_at),
  };
}

// Fetch all contacts
async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('last_name', { ascending: true });

  if (error) throw error;
  return (data || []).map(convertContactFromDb);
}

// Fetch single contact by ID
async function fetchContact(id: string): Promise<Contact> {
  const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();

  if (error) throw error;
  return convertContactFromDb(data);
}

// Create contact
interface CreateContactData {
  firstName: string;
  lastName: string;
  relationship: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
}

async function createContact(data: CreateContactData): Promise<Contact> {
  const insertData = {
    first_name: data.firstName,
    last_name: data.lastName,
    relationship: data.relationship,
    email: data.email || null,
    phone: data.phone || null,
    organization: data.organization || null,
    notes: data.notes || null,
  };

  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return convertContactFromDb(newContact);
}

// Update contact
interface UpdateContactData {
  id: string;
  firstName?: string;
  lastName?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
}

async function updateContact(data: UpdateContactData): Promise<Contact> {
  const { id, ...updateFields } = data;

  const updateData: any = {};
  if (updateFields.firstName !== undefined) updateData.first_name = updateFields.firstName;
  if (updateFields.lastName !== undefined) updateData.last_name = updateFields.lastName;
  if (updateFields.relationship !== undefined) updateData.relationship = updateFields.relationship;
  if (updateFields.email !== undefined) updateData.email = updateFields.email || null;
  if (updateFields.phone !== undefined) updateData.phone = updateFields.phone || null;
  if (updateFields.organization !== undefined)
    updateData.organization = updateFields.organization || null;
  if (updateFields.notes !== undefined) updateData.notes = updateFields.notes || null;

  const { data: updatedContact, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return convertContactFromDb(updatedContact);
}

// Delete contact
async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id);

  if (error) throw error;
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
    queryFn: fetchContacts,
  });
}

/**
 * Hook to fetch a single contact by ID
 * @param {string} id - The contact's unique identifier
 * @returns {UseQueryResult<Contact>} React Query result with contact data
 * @example
 * const { data: contact, isLoading } = useContact(contactId);
 */
export function useContact(id: string) {
  return useQuery({
    queryKey: queryKeys.contact(id),
    queryFn: () => fetchContact(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new contact
 * @returns {UseMutationResult} React Query mutation with mutate function
 * @example
 * const createContact = useCreateContact();
 * createContact.mutate({
 *   firstName: 'Jane',
 *   lastName: 'Smith',
 *   relationship: 'Parent',
 *   email: 'jane@example.com'
 * });
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onSuccess: newContact => {
      // Invalidate contacts list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });

      // Optimistically add to cache
      queryClient.setQueryData(queryKeys.contact(newContact.id), newContact);

      toast.success('Contact created successfully');
    },
    onError: error => {
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
 *   phone: '555-1234',
 *   organization: 'ABC School'
 * });
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContact,
    onMutate: async data => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contact(data.id) });

      // Snapshot previous value
      const previousContact = queryClient.getQueryData(queryKeys.contact(data.id));

      // Optimistically update
      if (previousContact) {
        queryClient.setQueryData(queryKeys.contact(data.id), {
          ...previousContact,
          ...data,
        });
      }

      return { previousContact };
    },
    onSuccess: updatedContact => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.contact(updatedContact.id), updatedContact);

      // Invalidate contacts list
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });

      toast.success('Contact updated successfully');
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousContact) {
        queryClient.setQueryData(queryKeys.contact(variables.id), context.previousContact);
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
      const previousContacts = queryClient.getQueryData(queryKeys.contacts);

      // Optimistically remove from list
      queryClient.setQueryData(queryKeys.contacts, (old: Contact[] | undefined) =>
        old ? old.filter(c => c.id !== id) : []
      );

      return { previousContacts };
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.contact(id) });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      queryClient.invalidateQueries({ queryKey: queryKeys.interactionsByContact(id) });

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
