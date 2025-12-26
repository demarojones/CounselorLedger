import { z } from 'zod';

// Reason category form schema
export const reasonCategoryFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be hex color like #FF5733)')
    .optional()
    .or(z.literal('')),
  sortOrder: z
    .number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order must be non-negative')
    .default(0),
});

// Reason subcategory form schema
export const reasonSubcategoryFormSchema = z.object({
  categoryId: z.uuid('Invalid category ID'),
  name: z
    .string()
    .min(1, 'Subcategory name is required')
    .max(100, 'Subcategory name must be less than 100 characters')
    .trim(),
  sortOrder: z
    .number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order must be non-negative')
    .default(0),
});

export type ReasonCategoryFormSchema = z.infer<typeof reasonCategoryFormSchema>;
export type ReasonSubcategoryFormSchema = z.infer<typeof reasonSubcategoryFormSchema>;
