import { z } from 'zod';

export const jobPostingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters long')
    .max(100, 'Title cannot exceed 100 characters'),

  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters long')
    .max(2000, 'Description cannot exceed 2000 characters'),

  requiredSkills: z
    .array(z.string().trim().min(1, 'Skill cannot be empty'))
    .min(1, 'At least one skill is required'),

  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format for deadline',
    })
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), {
      message: 'Deadline must be in the future',
    }),

  jobLink: z.string().url('Invalid URL format').optional().or(z.literal('')),
});
