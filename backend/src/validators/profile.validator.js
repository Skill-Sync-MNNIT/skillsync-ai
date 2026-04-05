import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().max(80).optional(),
  course: z.string().max(50).optional(),
  branch: z.enum(['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'NA']).optional(),
  year: z.number().int().min(1).max(4).optional(),
  cpi: z.number().min(0).max(10).optional(),
  skills: z.array(z.string().min(1).max(50)).max(30).optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User identifier is required'),
});
