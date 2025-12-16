import { z } from 'zod';

export const KidSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  birthday: z.string().date().nullable(),
  grade: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const KidCreateSchema = z.object({
  name: z.string().min(1),
  birthday: z.string().date().optional().nullable(),
  grade: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const KidUpdateSchema = KidCreateSchema.partial();

export type Kid = z.infer<typeof KidSchema>;
export type KidCreate = z.infer<typeof KidCreateSchema>;
export type KidUpdate = z.infer<typeof KidUpdateSchema>;
