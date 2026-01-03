import { z } from 'zod';

// Grade level options
export const gradeLevelSchema = z.enum([
  'Pre-K',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
]);

// Student form schema
export const studentFormSchema = z.object({
  studentId: z
    .string()
    .min(1, 'Student ID is required')
    .max(20, 'Student ID must be less than 20 characters')
    .trim(),
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
  gradeLevel: gradeLevelSchema,
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s\-\(\)\+]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  needsFollowUp: z.boolean().default(false),
  followUpNotes: z
    .string()
    .max(500, 'Follow-up notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type StudentFormSchema = z.infer<typeof studentFormSchema>;
export type GradeLevel = z.infer<typeof gradeLevelSchema>;
