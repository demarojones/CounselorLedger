import { useState, useEffect } from 'react';
import type { ReasonSubcategory } from '@/types/reason';
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
import { reasonSubcategoryFormSchema } from '@/schemas/reasonCategory';
import { z } from 'zod';

interface SubcategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  subcategory?: ReasonSubcategory | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
}

interface FormErrors {
  name?: string;
}

export function SubcategoryForm({
  open,
  onOpenChange,
  categoryId,
  subcategory,
  onSuccess,
}: SubcategoryFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subcategory) {
      setFormData({
        name: subcategory.name,
      });
    } else {
      setFormData({
        name: '',
      });
    }
    setErrors({});
  }, [subcategory, open]);

  const validateForm = (): boolean => {
    try {
      reasonSubcategoryFormSchema.parse({
        categoryId,
        name: formData.name,
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
      if (subcategory) {
        // Update existing subcategory
        const { error: updateError } = await supabase
          .from('reason_subcategories')
          .update({
            name: formData.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subcategory.id);

        if (updateError) throw updateError;
      } else {
        // Create new subcategory
        // Get max sort order for this category
        const { data: existingSubcategories } = await supabase
          .from('reason_subcategories')
          .select('sort_order')
          .eq('category_id', categoryId)
          .order('sort_order', { ascending: false })
          .limit(1);

        const maxSortOrder = existingSubcategories?.[0]?.sort_order || 0;

        const { error: createError } = await supabase.from('reason_subcategories').insert({
          id: crypto.randomUUID(),
          category_id: categoryId,
          name: formData.name,
          sort_order: maxSortOrder + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (createError) throw createError;
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving subcategory:', err);
      alert('Failed to save subcategory. Please try again.');
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
          <DialogTitle>
            {subcategory ? 'Edit Subcategory' : 'Create New Subcategory'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subcategory Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., Study Skills"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
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
              {isSubmitting
                ? 'Saving...'
                : subcategory
                  ? 'Update Subcategory'
                  : 'Create Subcategory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
