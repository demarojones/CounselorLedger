import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { toast } from '@/utils/toast';
import { handleApiError } from '@/utils/errorHandling';
import type { Interaction, InteractionFormData, InteractionDbResponse } from '@/types/interaction';
import type { Student, StudentDbResponse } from '@/types/student';
import type { Contact, ContactDbResponse } from '@/types/contact';
import type {
  ReasonCategory,
  ReasonSubcategory,
  ReasonCategoryDbResponse,
  ReasonSubcategoryDbResponse,
} from '@/types/reason';
import type { User } from '@/types/user';

interface UseInteractionsResult {
  interactions: Interaction[];
  students: Student[];
  contacts: Contact[];
  categories: ReasonCategory[];
  subcategories: ReasonSubcategory[];
  isLoading: boolean;
  error: string | null;
  createInteraction: (data: InteractionFormData) => Promise<void>;
  updateInteraction: (id: string, data: Partial<InteractionFormData>) => Promise<void>;
  deleteInteraction: (id: string) => Promise<void>;
  completeFollowUp: (id: string, completionNotes?: string) => Promise<void>;
  refreshInteractions: () => Promise<void>;
}

// Helper function to convert snake_case DB response to camelCase
function convertInteractionFromDb(
  dbInteraction: InteractionDbResponse,
  students: Student[],
  contacts: Contact[],
  categories: ReasonCategory[],
  subcategories: ReasonSubcategory[],
  counselors: User[]
): Interaction {
  const student = students.find(s => s.id === dbInteraction.student_id);
  const contact = contacts.find(c => c.id === dbInteraction.contact_id);
  const regardingStudent = students.find(s => s.id === dbInteraction.regarding_student_id);
  const category = categories.find(c => c.id === dbInteraction.category_id);
  const subcategory = subcategories.find(s => s.id === dbInteraction.subcategory_id);
  const counselor = counselors.find(c => c.id === dbInteraction.counselor_id);

  return {
    id: dbInteraction.id,
    counselorId: dbInteraction.counselor_id,
    studentId: dbInteraction.student_id,
    contactId: dbInteraction.contact_id,
    regardingStudentId: dbInteraction.regarding_student_id,
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
    regardingStudent,
    category,
    subcategory,
    counselor,
  };
}

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

/**
 * Hook to manage interactions and related data (students, contacts, categories)
 * Provides CRUD operations for interactions and follow-up management
 * @returns {UseInteractionsResult} Object containing interactions, related data, loading state, and CRUD functions
 * @example
 * const {
 *   interactions,
 *   students,
 *   contacts,
 *   categories,
 *   isLoading,
 *   createInteraction,
 *   updateInteraction,
 *   deleteInteraction,
 *   completeFollowUp
 * } = useInteractions();
 */
export function useInteractions(): UseInteractionsResult {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<ReasonCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ReasonSubcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store counselors in a ref to avoid re-renders but keep it accessible
  const [, setCounselorsCache] = useState<User[]>([]);

  // Fetch all required data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('last_name', { ascending: true });

      if (studentsError) throw studentsError;

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('last_name', { ascending: true });

      if (contactsError) throw contactsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('reason_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('reason_subcategories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (subcategoriesError) throw subcategoriesError;

      // Fetch counselors
      const { data: counselorsData, error: counselorsError } = await supabase
        .from('users')
        .select('*');

      if (counselorsError) throw counselorsError;

      // Fetch interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .order('start_time', { ascending: false });

      if (interactionsError) throw interactionsError;

      // Convert data
      const convertedStudents = (studentsData || []).map(convertStudentFromDb);
      const convertedContacts = (contactsData || []).map(convertContactFromDb);
      const convertedCategories = (categoriesData || []).map(convertCategoryFromDb);
      const convertedSubcategories = (subcategoriesData || []).map(convertSubcategoryFromDb);
      const convertedCounselors = (counselorsData || []).map((user: any) => ({
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

      setStudents(convertedStudents);
      setContacts(convertedContacts);
      setCategories(convertedCategories);
      setSubcategories(convertedSubcategories);
      setCounselorsCache(convertedCounselors);

      // Convert interactions with all related data
      const convertedInteractions = (interactionsData || []).map(interaction =>
        convertInteractionFromDb(
          interaction,
          convertedStudents,
          convertedContacts,
          convertedCategories,
          convertedSubcategories,
          convertedCounselors
        )
      );

      setInteractions(convertedInteractions);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create interaction
  const createInteraction = useCallback(
    async (data: InteractionFormData) => {
      setError(null);

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Calculate end time
        const startTime = new Date(data.startTime);
        const endTime = new Date(startTime.getTime() + data.durationMinutes * 60000);

        // Prepare data for insertion
        const insertData = {
          counselor_id: user.id,
          student_id: data.studentId || null,
          contact_id: data.contactId || null,
          regarding_student_id: data.regardingStudentId || null,
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

        const { error: insertError } = await supabase.from('interactions').insert(insertData);

        if (insertError) throw insertError;

        // Refresh data with optimistic update
        await fetchData();
        toast.success('Interaction created successfully');
      } catch (err) {
        console.error('Error creating interaction:', err);
        const error = handleApiError(err, { customMessage: 'Failed to create interaction' });
        setError(error.message);
        throw err;
      }
    },
    [fetchData]
  );

  // Update interaction
  const updateInteraction = useCallback(
    async (id: string, data: Partial<InteractionFormData>) => {
      setError(null);

      try {
        // Prepare update data
        const updateData: any = {};

        if (data.studentId !== undefined) updateData.student_id = data.studentId || null;
        if (data.contactId !== undefined) updateData.contact_id = data.contactId || null;
        if (data.regardingStudentId !== undefined)
          updateData.regarding_student_id = data.regardingStudentId || null;
        if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
        if (data.subcategoryId !== undefined)
          updateData.subcategory_id = data.subcategoryId || null;
        if (data.customReason !== undefined) updateData.custom_reason = data.customReason || null;
        if (data.startTime !== undefined) updateData.start_time = data.startTime;
        if (data.durationMinutes !== undefined) {
          updateData.duration_minutes = data.durationMinutes;
          // Recalculate end time if duration or start time changed
          if (data.startTime || updateData.start_time) {
            const startTime = new Date(data.startTime || updateData.start_time);
            const endTime = new Date(startTime.getTime() + data.durationMinutes * 60000);
            updateData.end_time = endTime.toISOString();
          }
        }
        if (data.notes !== undefined) updateData.notes = data.notes || null;
        if (data.needsFollowUp !== undefined) updateData.needs_follow_up = data.needsFollowUp;
        if (data.followUpDate !== undefined) updateData.follow_up_date = data.followUpDate || null;
        if (data.followUpNotes !== undefined)
          updateData.follow_up_notes = data.followUpNotes || null;

        const { error: updateError } = await supabase
          .from('interactions')
          .update(updateData)
          .eq('id', id);

        if (updateError) throw updateError;

        // Refresh data
        await fetchData();
        toast.success('Interaction updated successfully');
      } catch (err) {
        console.error('Error updating interaction:', err);
        const error = handleApiError(err, { customMessage: 'Failed to update interaction' });
        setError(error.message);
        throw err;
      }
    },
    [fetchData]
  );

  // Delete interaction
  const deleteInteraction = useCallback(async (id: string) => {
    setError(null);

    try {
      const { error: deleteError } = await supabase.from('interactions').delete().eq('id', id);

      if (deleteError) throw deleteError;

      // Optimistically remove from state
      setInteractions(prev => prev.filter(i => i.id !== id));
      toast.success('Interaction deleted successfully');
    } catch (err) {
      console.error('Error deleting interaction:', err);
      const error = handleApiError(err, { customMessage: 'Failed to delete interaction' });
      setError(error.message);
      throw err;
    }
  }, []);

  // Complete follow-up
  const completeFollowUp = useCallback(
    async (id: string, completionNotes?: string) => {
      setError(null);

      try {
        // Get the current interaction to append completion notes
        const interaction = interactions.find(i => i.id === id);
        if (!interaction) {
          throw new Error('Interaction not found');
        }

        // Prepare update data
        const updateData: any = {
          is_follow_up_complete: true,
        };

        // Append completion notes to existing notes if provided
        if (completionNotes) {
          const existingNotes = interaction.notes || '';
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

        const { error: updateError } = await supabase
          .from('interactions')
          .update(updateData)
          .eq('id', id);

        if (updateError) throw updateError;

        // Refresh data
        await fetchData();
        toast.success('Follow-up completed successfully');
      } catch (err) {
        console.error('Error completing follow-up:', err);
        const error = handleApiError(err, { customMessage: 'Failed to complete follow-up' });
        setError(error.message);
        throw err;
      }
    },
    [interactions, fetchData]
  );

  return {
    interactions,
    students,
    contacts,
    categories,
    subcategories,
    isLoading,
    error,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    completeFollowUp,
    refreshInteractions: fetchData,
  };
}
