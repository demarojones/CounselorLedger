import { z } from 'zod';

export const interactionFormSchema = z
  .object({
    type: z.enum(['student', 'contact'], {
      message: 'Please select interaction type',
    }),
    studentId: z.string().optional(),
    contactId: z.string().optional(),
    categoryId: z.string().min(1, 'Category is required'),
    subcategoryId: z.string().optional(),
    customReason: z.string().optional(),
    startTime: z.string().min(1, 'Start time is required'),
    durationMinutes: z
      .number({
        message: 'Duration must be a number',
      })
      .min(1, 'Duration must be at least 1 minute')
      .max(480, 'Duration cannot exceed 8 hours'),
    notes: z.string().optional(),
    needsFollowUp: z.boolean().default(false),
    followUpDate: z.string().optional(),
    followUpNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Either studentId or contactId must be provided
      return data.studentId || data.contactId;
    },
    {
      message: 'Either student or contact must be selected',
      path: ['studentId'],
    }
  )
  .refine(
    (data) => {
      // If subcategory is "Custom", customReason is required
      if (data.subcategoryId) {
        // We'll check this in the component based on subcategory name
        return true;
      }
      return true;
    },
    {
      message: 'Custom reason is required when "Other | Custom" is selected',
      path: ['customReason'],
    }
  )
  .refine(
    (data) => {
      // If needsFollowUp is true, followUpDate is required
      if (data.needsFollowUp && !data.followUpDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Follow-up date is required when follow-up is needed',
      path: ['followUpDate'],
    }
  );

export type InteractionFormSchema = z.infer<typeof interactionFormSchema>;
