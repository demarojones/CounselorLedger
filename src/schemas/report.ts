import { z } from 'zod';

// Report filters schema
export const reportFiltersSchema = z
  .object({
    startDate: z.date({
      message: 'Invalid start date',
    }),
    endDate: z.date({
      message: 'Invalid end date',
    }),
    gradeLevel: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    counselorId: z.string().uuid('Invalid counselor ID').optional(),
  })
  .refine(
    data => {
      // End date must be after or equal to start date
      return data.endDate >= data.startDate;
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    }
  )
  .refine(
    data => {
      // Start date cannot be in the future
      const now = new Date();
      return data.startDate <= now;
    },
    {
      message: 'Start date cannot be in the future',
      path: ['startDate'],
    }
  );

// Date range preset schema
export const dateRangePresetSchema = z.enum([
  'last7days',
  'last30days',
  'last90days',
  'lastYear',
  'custom',
]);

export type ReportFiltersSchema = z.infer<typeof reportFiltersSchema>;
export type DateRangePreset = z.infer<typeof dateRangePresetSchema>;
