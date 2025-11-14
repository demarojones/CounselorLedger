import { useState, useEffect } from 'react';
import type { ReasonCategory } from '@/types/reason';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reasonCategoryFormSchema } from '@/schemas/reasonCategory';
import { z } from 'zod';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ReasonCategory | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  color: string;
}

interface FormErrors {
  name?: string;
  color?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

export function CategoryForm({ open, onOpenChange, category, onSuccess }: CategoryFormProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    color: DEFAULT_COLORS[0],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        color: category.color || DEFAULT_COLORS[0],
      });
    } else {
      setFormData({
        name: '',
        color: DEFAULT_COLORS[0],
      });
    }
    setErrors({});
  }, [category, open]);

  const validateForm = (): boolean => {
    try {
      reasonCategoryFormSchema.parse({
        name: formData.name,
        color: formData.color,
        sortOrder: 0, // Will be calculated on submit
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          if (field) {
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (category) {
        // Update existing category
        const { error: updateError } = await supabase
          .from('reason_categories')
          .update({
            name: formData.name,
            color: formData.color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', category.id);

        if (updateError) throw updateError;
      } else {
        // Create new category
        // Get max sort order
        const { data: existingCategories } = await supabase
          .from('reason_categories')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1);

        const maxSortOrder = existingCategories?.[0]?.sort_order || 0;

        const { error: createError } = await supabase.from('reason_categories').insert({
          id: crypto.randomUUID(),
          tenant_id: currentUser?.tenantId,
          name: formData.name,
          color: formData.color,
          sort_order: maxSortOrder + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (createError) throw createError;
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Create New Category'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., Academic Support"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color *</Label>
            <div className="flex items-center gap-3">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={e => handleChange('color', e.target.value)}
                className="w-20 h-10"
              />
              <div className="flex gap-2">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleChange('color', color)}
                    className={`w-8 h-8 rounded border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            {errors.color && (
              <p className="text-sm text-red-600">{errors.color}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
