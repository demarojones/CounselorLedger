import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ReasonCategory, ReasonSubcategory } from '@/types/reason';
import { supabase } from '@/services/supabase';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { SubcategoryForm } from './SubcategoryForm';

export function ReasonManagement() {
  const { user: currentUser } = useAuth();
  const [categories, setCategories] = useState<ReasonCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ReasonSubcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isSubcategoryFormOpen, setIsSubcategoryFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReasonCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<ReasonSubcategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

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

      // Transform categories
      const transformedCategories: ReasonCategory[] = (categoriesData || []).map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        sortOrder: c.sort_order,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      }));

      // Transform subcategories
      const transformedSubcategories: ReasonSubcategory[] = (subcategoriesData || []).map(s => ({
        id: s.id,
        categoryId: s.category_id,
        name: s.name,
        sortOrder: s.sort_order,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      }));

      setCategories(transformedCategories);
      setSubcategories(transformedSubcategories);
    } catch (err) {
      console.error('Error fetching reason data:', err);
      setError('Failed to load reason categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setIsCategoryFormOpen(true);
  };

  const handleEditCategory = (category: ReasonCategory) => {
    setSelectedCategory(category);
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this category? All subcategories will also be deleted.'
      )
    ) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('reason_categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) throw deleteError;

      await fetchData();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category');
    }
  };

  const handleCreateSubcategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategory(null);
    setIsSubcategoryFormOpen(true);
  };

  const handleEditSubcategory = (subcategory: ReasonSubcategory) => {
    setSelectedCategoryId(subcategory.categoryId);
    setSelectedSubcategory(subcategory);
    setIsSubcategoryFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchData();
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('reason_subcategories')
        .delete()
        .eq('id', subcategoryId);

      if (deleteError) throw deleteError;

      await fetchData();
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      alert('Failed to delete subcategory');
    }
  };

  const getCategorySubcategories = (categoryId: string) => {
    return subcategories.filter(s => s.categoryId === categoryId);
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reason Category Management</h2>
          <p className="text-gray-600 mt-1">
            Manage interaction reason categories and subcategories
          </p>
        </div>
        <Button onClick={handleCreateCategory}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No categories found</p>
          </div>
        ) : (
          categories.map(category => (
            <div
              key={category.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <button
                    className="cursor-grab hover:bg-gray-200 p-1 rounded"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {category.color && (
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: category.color }} />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateSubcategory(category.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Subcategory
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Subcategories */}
              <div className="p-4">
                {getCategorySubcategories(category.id).length === 0 ? (
                  <p className="text-gray-500 text-sm">No subcategories</p>
                ) : (
                  <div className="space-y-2">
                    {getCategorySubcategories(category.id).map(subcategory => (
                      <div
                        key={subcategory.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            className="cursor-grab hover:bg-gray-200 p-1 rounded"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          <span className="text-gray-900">{subcategory.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSubcategory(subcategory)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <CategoryForm
        open={isCategoryFormOpen}
        onOpenChange={setIsCategoryFormOpen}
        category={selectedCategory}
        onSuccess={handleFormSuccess}
      />

      <SubcategoryForm
        open={isSubcategoryFormOpen}
        onOpenChange={setIsSubcategoryFormOpen}
        categoryId={selectedCategoryId}
        subcategory={selectedSubcategory}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
