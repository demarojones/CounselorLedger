import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { toast } from '@/utils/toast';
import { handleApiError } from '@/utils/errorHandling';
import { queryKeys } from '@/lib/queryClient';
import type {
  Interaction,
  InteractionFormData,
  InteractionDbResponse,
} from '@/types/interaction';
import type { Student, StudentDbResponse } from '@/types/student';
import type { Contact, ContactDbResponse } from '@/types/contact';
import type {
  ReasonCategory,
  ReasonSubcategory,
  ReasonCategoryDbResponse,
  ReasonSubcategoryDbResponse,
} from '@/types/reason';
import type { User } from '@/types/user';

// Helper functions to convert snake_case DB responses to camelCase
function convertStudentFromDb(dbStudent: StudentDbResponse): Student {
  return {
    id: dbStudent.id,
    studentId: dbStudent.student_id,
    firstName: dbStudent.first_name,
    lastName: dbStudent.last_name,
    gradeLevel: dbStudent.grade_level,
    email: dbStudent.email,
    phone: dbStudent.phone,
    needsFollowUp: dbStudent.needs_follow_up,
    followUpNotes: dbStudent.follow_up_notes,
    createdAt: new Date(dbStudent.created_at),
    updatedAt: new Date(dbStudent.updated_at),
  };
}

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

function convertCategoryFromDb(dbCategory: ReasonCategoryDbResponse): ReasonCategory {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    color: dbCategory.color,
    sortOrder: dbCategory.sort_order,
    createdAt: new Date(dbCategory.created_at),
    updatedAt: new Date(dbCategory.updated_at),
  };
}

function convertSubcategoryFromDb(dbSubcategory: ReasonSubcategoryDbResponse): ReasonSubcategory {
  return {
    id: dbSubcategory.id,
    categoryId: dbSubcategory.category_id,
    name: dbSubcategory.name,
    sortOrder: dbSubcategory.sort_order,
    createdAt: new Date(dbSubcategory.created_at),
    updatedAt: new Date(dbSubcategory.updated_at),
  };
}

function convertInteractionFromDb(
  dbInteraction: InteractionDbResponse,
  students: Student[],
  contacts: Contact[],
  categories: ReasonCategory[],
  subcategories: ReasonSubcategory[],
  counselors: User[]
): Interaction {
  const student = students.find((s) => s.id === dbInteraction.student_id);
  const contact = contacts.find((c) => c.id === dbInteraction.contact_id);
  const category = categories.find((c) => c.id === dbInteraction.category_id);
  const subcategory = subcategories.find((s) => s.id === dbInteraction.subcategory_id);
  const counselor = counselors.find((c) => c.id === dbInteraction.counselor_id);

  return {
    id: dbInteraction.id,
    counselorId: dbInteraction.counselor_id,
    studentId: dbInteraction.student_id,
    contactId: dbInteraction.contact_id,
    categoryId: dbInteraction.category_id,
    subcategoryId: dbInteraction.subcategory_id,
    customReason: dbInteraction.custom_reason,
    startTime: new Date(dbInteraction.start_time),
    durationMinutes: dbInteraction.duration_minutes,
    endTime: new Date(dbInteraction.end_time),
    notes: dbInteraction.notes,
    needsFollowUp: dbInteraction.needs_follow_up,
    followUpDate: dbInteraction.follow_up_date ? new Date(dbInteraction.follow_up_date) : undefined,
    followUpNotes: dbInteraction.follow_up_notes,
    isFollowUpComplete: dbInteraction.is_follow_up_complete,
    createdAt: new Date(dbInteraction.created_at),
    updatedAt: new Date(dbInteraction.updated_at),
    student,
    contact,
    category,
    subcategory,
    counselor,
  };
}

// Fetch functions
async function fetchInteractions(): Promise<Interaction[]> {
  // Fetch all required data in parallel
  const [
    { data: interactionsData, error: interactionsError },
    { data: studentsData, error: studentsError },
    { data: contactsData, error: contactsError },
    { data: categoriesData, error: categoriesError },
    { data: subcategoriesData, error: subcategoriesError },
    { data: counselorsData, error: counselorsError },
  ] = await Promise.all([
    supabase.from('interactions').select('*').order('start_time', { ascending: false }),
    supabase.from('students').select('*'),
    supabase.from('contacts').select('*'),
    supabase.from('reason_categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('reason_subcategories').select('*').order('sort_order', { ascending: true }),
    supabase.from('users').select('*'),
  ]);

  if (interactionsError) throw interactionsError;
  if (studentsError) throw studentsError;
  if (contactsError) throw contactsError;
  if (categoriesError) throw categoriesError;
  if (subcategoriesError) throw subcategoriesError;
  if (counselorsError) throw counselorsError;

  // Convert data
  const students = (studentsData || []).map(convertStudentFromDb);
  const contacts = (contactsData || []).map(convertContactFromDb);
  const categories = (categoriesData || []).map(convertCategoryFromDb);
  const subcategories = (subcategoriesData || []).map(convertSubcategoryFromDb);
  const counselors = (counselorsData || []).map((user: any) => ({
    id: user.id,
    email: user.email,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    role: user.role,
    tenantId: user.tenant_id || user.tenantId,
    isActive: user.is_active ?? user.isActive ?? true,
    createdAt: new Date(user.created_at || user.createdAt || Date.now()),
    updatedAt: new Date(user.updated_at || user.updatedAt || Date.now()),
  }));

  // Convert interactions with all related data
  return (interactionsData || []).map((interaction) =>
    convertInteractionFromDb(interaction, students, contacts, categories, subcategories, counselors)
  );
}

async function fetchInteraction(id: string): Promise<Interaction> {
  // Fetch interaction and related data
  const [
    { data: interactionData, error: interactionError },
    { data: studentsData, error: studentsError },
    { data: contactsData, error: contactsError },
    { data: categoriesData, error: categoriesError },
    { data: subcategoriesData, error: subcategoriesError },
    { data: counselorsData, error: counselorsError },
  ] = await Promise.all([
    supabase.from('interactions').select('*').eq('id', id).single(),
    supabase.from('students').select('*'),
    supabase.from('contacts').select('*'),
    supabase.from('reason_categories').select('*'),
    supabase.from('reason_subcategories').select('*'),
    supabase.from('users').select('*'),
  ]);

  if (interactionError) throw interactionError;
  if (studentsError) throw studentsError;
  if (contactsError) throw contactsError;
  if (categoriesError) throw categoriesError;
  if (subcategoriesError) throw subcategoriesError;
  if (counselorsError) throw counselorsError;

  const students = (studentsData || []).map(convertStudentFromDb);
  const contacts = (contactsData || []).map(convertContactFromDb);
  const categories = (categoriesData || []).map(convertCategoryFromDb);
  const subcategories = (subcategoriesData || []).map(convertSubcategoryFromDb);
  const counselors = (counselorsData || []).map((user: any) => ({
    id: user.id,
    email: user.email,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    role: user.role,
    tenantId: user.tenant_id || user.tenantId,
    isActive: user.is_active ?? user.isActive ?? true,
    createdAt: new Date(user.created_at || user.createdAt || Date.now()),
    updatedAt: new Date(user.updated_at || user.updatedAt || Date.now()),
  }));

  return convertInteractionFromDb(interactionData, students, contacts, categories, subcategories, counselors);
}

// Create interaction
async function createInteraction(data: InteractionFormData): Promise<Interaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const startTime = new Date(data.startTime);
  const endTime = new Date(startTime.getTime() + data.durationMinutes * 60000);

  const insertData = {
    counselor_id: user.id,
    student_id: data.studentId || null,
    contact_id: data.contactId || null,
    category_id: data.categoryId,
    subcategory_id: data.subcategoryId || null,
    custom_reason: data.customReason || null,
    start_time: data.startTime,
    duration_minutes: data.durationMinutes,
    end_time: endTime.toISOString(),
    notes: data.notes || null,
    needs_follow_up: data.needsFollowUp,
    follow_up_date: data.followUpDate || null,
    follow_up_notes: data.followUpNotes || null,
    is_follow_up_complete: false,
  };

  const { data: newInteraction, error } = await supabase
    .from('interactions')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;

  // Fetch the complete interaction with relations
  return fetchInteraction(newInteraction.id);
}

// Update interaction
interface UpdateInteractionData {
  id: string;
  data: Partial<InteractionFormData>;
}

async function updateInteraction({ id, data }: UpdateInteractionData): Promise<Interaction> {
  const updateData: any = {};

  if (data.studentId !== undefined) updateData.student_id = data.studentId || null;
  if (data.contactId !== undefined) updateData.contact_id = data.contactId || null;
  if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
  if (data.subcategoryId !== undefined) updateData.subcategory_id = data.subcategoryId || null;
  if (data.customReason !== undefined) updateData.custom_reason = data.customReason || null;
  if (data.startTime !== undefined) updateData.start_time = data.startTime;
  if (data.durationMinutes !== undefined) {
    updateData.duration_minutes = data.durationMinutes;
    if (data.startTime || updateData.start_time) {
      const startTime = new Date(data.startTime || updateData.start_time);
      const endTime = new Date(startTime.getTime() + data.durationMinutes * 60000);
      updateData.end_time = endTime.toISOString();
    }
  }
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.needsFollowUp !== undefined) updateData.needs_follow_up = data.needsFollowUp;
  if (data.followUpDate !== undefined) updateData.follow_up_date = data.followUpDate || null;
  if (data.followUpNotes !== undefined) updateData.follow_up_notes = data.followUpNotes || null;

  const { error } = await supabase.from('interactions').update(updateData).eq('id', id);

  if (error) throw error;

  return fetchInteraction(id);
}

// Delete interaction
async function deleteInteraction(id: string): Promise<void> {
  const { error } = await supabase.from('interactions').delete().eq('id', id);
  if (error) throw error;
}

// Complete follow-up
interface CompleteFollowUpData {
  id: string;
  completionNotes?: string;
}

async function completeFollowUp({ id, completionNotes }: CompleteFollowUpData): Promise<Interaction> {
  // Get current interaction
  const { data: interactionData, error: fetchError } = await supabase
    .from('interactions')
    .select('notes')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const updateData: any = {
    is_follow_up_complete: true,
  };

  if (completionNotes) {
    const existingNotes = interactionData.notes || '';
    const completionTimestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const completionNote = `\n\n[Follow-up completed on ${completionTimestamp}]\n${completionNotes}`;
    updateData.notes = existingNotes + completionNote;
  }

  const { error } = await supabase.from('interactions').update(updateData).eq('id', id);

  if (error) throw error;

  return fetchInteraction(id);
}

// Hooks
export function useInteractionsQuery() {
  return useQuery({
    queryKey: queryKeys.interactions,
    queryFn: fetchInteractions,
  });
}

export function useInteractionQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.interaction(id),
    queryFn: () => fetchInteraction(id),
    enabled: !!id,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInteraction,
    onSuccess: (newInteraction) => {
      // Invalidate and refetch interactions
      queryClient.invalidateQueries({ queryKey: queryKeys.interactions });
      
      // Add to cache
      queryClient.setQueryData(queryKeys.interaction(newInteraction.id), newInteraction);
      
      // Invalidate related queries
      if (newInteraction.studentId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.interactionsByStudent(newInteraction.studentId) 
        });
      }
      if (newInteraction.contactId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.interactionsByContact(newInteraction.contactId) 
        });
      }
      
      toast.success('Interaction created successfully');
    },
    onError: (error) => {
      const apiError = handleApiError(error, { customMessage: 'Failed to create interaction' });
      toast.error(apiError.message);
    },
  });
}

export function useUpdateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInteraction,
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.interaction(id) });
      
      // Snapshot previous value
      const previousInteraction = queryClient.getQueryData(queryKeys.interaction(id));
      
      // Optimistically update
      if (previousInteraction) {
        queryClient.setQueryData(queryKeys.interaction(id), {
          ...previousInteraction,
          ...data,
        });
      }
      
      return { previousInteraction };
    },
    onSuccess: (updatedInteraction) => {
      // Update cache
      queryClient.setQueryData(queryKeys.interaction(updatedInteraction.id), updatedInteraction);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.interactions });
      
      toast.success('Interaction updated successfully');
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousInteraction) {
        queryClient.setQueryData(queryKeys.interaction(variables.id), context.previousInteraction);
      }
      
      const apiError = handleApiError(error, { customMessage: 'Failed to update interaction' });
      toast.error(apiError.message);
    },
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInteraction,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.interactions });
      
      // Snapshot previous value
      const previousInteractions = queryClient.getQueryData(queryKeys.interactions);
      
      // Optimistically remove
      queryClient.setQueryData(queryKeys.interactions, (old: Interaction[] | undefined) =>
        old ? old.filter((i) => i.id !== id) : []
      );
      
      return { previousInteractions };
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.interaction(id) });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.interactions });
      
      toast.success('Interaction deleted successfully');
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousInteractions) {
        queryClient.setQueryData(queryKeys.interactions, context.previousInteractions);
      }
      
      const apiError = handleApiError(error, { customMessage: 'Failed to delete interaction' });
      toast.error(apiError.message);
    },
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeFollowUp,
    onSuccess: (updatedInteraction) => {
      // Update cache
      queryClient.setQueryData(queryKeys.interaction(updatedInteraction.id), updatedInteraction);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.interactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.followUps });
      
      toast.success('Follow-up completed successfully');
    },
    onError: (error) => {
      const apiError = handleApiError(error, { customMessage: 'Failed to complete follow-up' });
      toast.error(apiError.message);
    },
  });
}
