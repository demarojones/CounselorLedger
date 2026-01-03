import { z } from 'zod';

// Password validation schema with strength requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Subdomain validation schema
const subdomainSchema = z
  .string()
  .min(3, 'Subdomain must be at least 3 characters')
  .max(63, 'Subdomain must be less than 63 characters')
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    'Subdomain must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen'
  )
  .refine(val => !val.includes('--'), 'Subdomain cannot contain consecutive hyphens')
  .refine(
    val => !['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost'].includes(val),
    'Subdomain cannot use reserved names'
  );

// Tenant setup form schema
export const tenantSetupSchema = z
  .object({
    tenantName: z
      .string()
      .min(1, 'Organization name is required')
      .max(100, 'Organization name must be less than 100 characters')
      .trim(),
    subdomain: subdomainSchema,
    adminFirstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .trim(),
    adminLastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .trim(),
    adminEmail: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .max(100, 'Email must be less than 100 characters')
      .toLowerCase()
      .trim(),
    adminPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
    contactPhone: z
      .string()
      .optional()
      .refine(
        val => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, '')),
        'Invalid phone number format'
      ),
    contactAddress: z.string().max(500, 'Address must be less than 500 characters').optional(),
    contactEmail: z
      .string()
      .email('Invalid email format')
      .max(100, 'Contact email must be less than 100 characters')
      .toLowerCase()
      .trim()
      .optional()
      .or(z.literal('')),
    contactPersonName: z
      .string()
      .max(100, 'Contact person name must be less than 100 characters')
      .trim()
      .optional(),
  })
  .refine(data => data.adminPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// User invitation form schema
export const invitationFormSchema = z.object({
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
  role: z.enum(['ADMIN', 'COUNSELOR']),
});

// User registration form schema (for invitation acceptance)
export const userRegistrationSchema = z
  .object({
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
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Type exports
export type TenantSetupFormData = z.infer<typeof tenantSetupSchema>;
export type InvitationFormData = z.infer<typeof invitationFormSchema>;
export type UserRegistrationFormData = z.infer<typeof userRegistrationSchema>;

// Subdomain uniqueness validation function (to be used with async validation)
export const validateSubdomainUniqueness = async (_subdomain: string): Promise<boolean> => {
  // This will be implemented when we have the API endpoint
  // For now, return true to allow form submission
  return true;
};
