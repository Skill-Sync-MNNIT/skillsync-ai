import { z } from 'zod';

export const updateProfileSchema = z.object({
  branch: z.enum(['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT']).optional(),
  year: z.number().int().min(1).max(4).optional(),
  skills: z.array(z.string().min(1).max(50)).max(30).optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
});
