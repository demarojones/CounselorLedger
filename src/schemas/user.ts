import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['ADMIN', 'COUNSELOR']);

// User form schema for creating/editing users
export const userFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
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
  role: userRoleSchema,
});

export type UserFormSchema = z.infer<typeof userFormSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
