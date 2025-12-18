import { z } from 'zod'

export const SourceMessageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  provider: z.enum(['outlook', 'manual']),
  external_id: z.string().nullable(),
  folder: z.string().nullable(),
  subject: z.string(),
  sender_name: z.string().nullable(),
  sender_email: z.string().email(),
  received_at: z.string().datetime().nullable(),
  body_text: z.string(),
  body_html: z.string().nullable(),
  created_at: z.string().datetime(),
})

export const SourceMessageCreateSchema = z.object({
  provider: z.enum(['outlook', 'manual']),
  external_id: z.string().optional().nullable(),
  folder: z.string().optional().nullable(),
  subject: z.string().min(1),
  sender_name: z.string().optional().nullable(),
  sender_email: z.string().email(),
  received_at: z.string().datetime().optional().nullable(),
  body_text: z.string().min(1),
  body_html: z.string().optional().nullable(),
})

export type SourceMessage = z.infer<typeof SourceMessageSchema>
export type SourceMessageCreate = z.infer<typeof SourceMessageCreateSchema>
