import { z } from 'zod';

export const projectCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  priorityIndex: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  dueDate: z.string().regex(/^\d{2}\/\d{2}\/\d{2}$/).nullable().optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const stepCreateSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().min(1).max(500),
  stepOrder: z.number().int().min(0).optional(),
  status: z.enum(['CLEAR', 'HOLD_POINT', 'COMPLETE']).optional(),
  dueDate: z.string().regex(/^\d{2}\/\d{2}\/\d{2}$/).nullable().optional(),
});

export const stepUpdateSchema = stepCreateSchema.partial().omit({ projectId: true });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
