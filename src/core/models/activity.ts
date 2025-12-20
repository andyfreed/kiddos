import { z } from 'zod'

/**
 * Activity templates (recurring things like "Soccer practice")
 */
export const ActivitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  default_place_id: z.string().uuid().nullable(),
  default_checklist: z.any().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const ActivityCreateSchema = z.object({
  name: z.string().min(1),
  default_place_id: z.string().uuid().nullable().optional(),
  default_checklist: z.any().nullable().optional(),
  notes: z.union([z.string(), z.literal(''), z.null()]).optional().nullable(),
})

export const ActivityUpdateSchema = ActivityCreateSchema.partial()

export type Activity = z.infer<typeof ActivitySchema>
export type ActivityCreate = z.infer<typeof ActivityCreateSchema>
export type ActivityUpdate = z.infer<typeof ActivityUpdateSchema>

