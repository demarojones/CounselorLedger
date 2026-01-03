import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { toast } from '@/utils/toast';
import { handleApiError } from '@/utils/errorHandling';
import { queryKeys } from '@/lib/queryClient';
import type {
  ReasonCategory,
  ReasonSubcategory,
  ReasonCategoryDbResponse,
  ReasonSubcategoryDbResponse,
} from '@/types/reason';

// Helper functions
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

// Fetch functions
async function fetchCategories(): Promise<ReasonCategory[]> {
  const { data, error } = await supabase
    .from('reason_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(convertCategoryFromDb);
}

async function fetchSubcategories(): Promise<ReasonSubcategory[]> {
  const { data, error } = await supabase
    .from('reason_subcategories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(convertSubcategoryFromDb);
}

async function fetchSubcategoriesByCategory(categoryId: string): Promise<ReasonSubcategory[]> {
  const { data, error } = await supabase
    .from('reason_subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(convertSubcategoryFromDb);
}

// Create category
interface CreateCategoryData {
  name: string;
  color?: string;
  sortOrder?: number;
}

async function createCategory(data: CreateCategoryData): Promise<ReasonCategory> {
  const insertData = {
    name: data.name,
    color: data.color || null,
    sort_order: data.sortOrder ?? 0,
  };

  const { data: newCategory, error } = await supabase
    .from('reason_categories')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return convertCategoryFromDb(newCategory);
}

// Update category
interface UpdateCategoryData {
  id: string;
  name?: string;
  color?: string;
  sortOrder?: number;
}

async function updateCategory(data: UpdateCategoryData): Promise<ReasonCategory> {
  const { id, ...updateFields } = data;

  const updateData: any = {};
  if (updateFields.name !== undefined) updateData.name = updateFields.name;
  if (updateFields.color !== undefined) updateData.color = updateFields.color || null;
  if (updateFields.sortOrder !== undefined) updateData.sort_order = updateFields.sortOrder;

  const { data: updatedCategory, error } = await supabase
    .from('reason_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return convertCategoryFromDb(updatedCategory);
}

// Delete category
async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('reason_categories').delete().eq('id', id);

  if (error) throw error;
}

// Create subcategory
interface CreateSubcategoryData {
  categoryId: string;
  name: string;
  sortOrder?: number;
}

async function createSubcategory(data: CreateSubcategoryData): Promise<ReasonSubcategory> {
  const insertData = {
    category_id: data.categoryId,
    name: data.name,
    sort_order: data.sortOrder ?? 0,
  };

  const { data: newSubcategory, error } = await supabase
    .from('reason_subcategories')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return convertSubcategoryFromDb(newSubcategory);
}

// Update subcategory
interface UpdateSubcategoryData {
  id: string;
  name?: string;
  sortOrder?: number;
}

async function updateSubcategory(data: UpdateSubcategoryData): Promise<ReasonSubcategory> {
  const { id, ...updateFields } = data;

  const updateData: any = {};
  if (updateFields.name !== undefined) updateData.name = updateFields.name;
  if (updateFields.sortOrder !== undefined) updateData.sort_order = updateFields.sortOrder;

  const { data: updatedSubcategory, error } = await supabase
    .from('reason_subcategories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return convertSubcategoryFromDb(updatedSubcategory);
}

// Delete subcategory
async function deleteSubcategory(id: string): Promise<void> {
  const { error } = await supabase.from('reason_subcategories').delete().eq('id', id);

  if (error) throw error;
}

// Hooks for categories
export function useReasonCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success('Category created successfully');
    },
    onError: error => {
      const apiError = handleApiError(error, { customMessage: 'Failed to create category' });
      toast.error(apiError.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success('Category updated successfully');
    },
    onError: error => {
      const apiError = handleApiError(error, { customMessage: 'Failed to update category' });
      toast.error(apiError.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success('Category deleted successfully');
    },
    onError: error => {
      const apiError = handleApiError(error, { customMessage: 'Failed to delete category' });
      toast.error(apiError.message);
    },
  });
}

// Hooks for subcategories
export function useReasonSubcategories() {
  return useQuery({
    queryKey: ['subcategories'],
    queryFn: fetchSubcategories,
  });
}

export function useSubcategoriesByCategory(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.subcategories(categoryId),
    queryFn: () => fetchSubcategoriesByCategory(categoryId),
    enabled: !!categoryId,
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubcategory,
    onSuccess: newSubcategory => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subcategories(newSubcategory.categoryId),
      });
      toast.success('Subcategory created successfully');
    },
    onError: error => {
      const apiError = handleApiError(error, { customMessage: 'Failed to create subcategory' });
      toast.error(apiError.message);
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubcategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Subcategory updated successfully');
    },
    onError: error => {
      const apiError = handleApiError(error, { customMessage: 'Failed to update subcategory' });
      toast.error(apiError.message);
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubcategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Subcategory deleted successfully');
    },
    onError: error => {
      const apiError = handleApiError(error, { customMessage: 'Failed to delete subcategory' });
      toast.error(apiError.message);
    },
  });
}
