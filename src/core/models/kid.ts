import { z } from 'zod';

export const KidSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  birthday: z.union([z.string(), z.null()]).nullable(), // Accept any string or null for dates
  grade: z.union([z.string(), z.null()]).nullable(),
  notes: z.union([z.string(), z.null()]).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const KidCreateSchema = z.object({
  name: z.string().min(1),
  birthday: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
    z.literal(''),
    z.null(),
    z.undefined()
  ]).optional().nullable().transform((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }),
  grade: z.union([
    z.string(),
    z.literal(''),
    z.null(),
    z.undefined()
  ]).optional().nullable().transform((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }),
  notes: z.union([
    z.string(),
    z.literal(''),
    z.null(),
    z.undefined()
  ]).optional().nullable().transform((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }),
});

export const KidUpdateSchema = KidCreateSchema.partial();

export type Kid = z.infer<typeof KidSchema>;
export type KidCreate = z.infer<typeof KidCreateSchema>;
export type KidUpdate = z.infer<typeof KidUpdateSchema>;
