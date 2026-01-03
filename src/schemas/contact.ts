import { z } from 'zod';

// Contact relationship enum
export const contactRelationshipSchema = z.enum([
  'Parent',
  'Guardian',
  'Teacher',
  'Administrator',
  'Counselor',
  'Social Worker',
  'Other',
]);

// Contact form schema
export const contactFormSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  relationship: contactRelationshipSchema,
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s\-\(\)\+]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  organization: z
    .string()
    .max(100, 'Organization must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
});

export type ContactFormSchema = z.infer<typeof contactFormSchema>;
export type ContactRelationship = z.infer<typeof contactRelationshipSchema>;
