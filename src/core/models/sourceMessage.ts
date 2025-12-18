import { z } from 'zod'

function normalizeDatetimeInput(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'string') return value

  let candidate = value.trim()
  if (!candidate) return value

  // Replace space between date/time with T
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(candidate)) {
    candidate = candidate.replace(' ', 'T')
  }

  // Add colon to timezone if missing (e.g. +0000 -> +00:00)
  if (/[+-]\d{4}$/.test(candidate)) {
    candidate = candidate.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  } else if (/[+-]\d{2}$/.test(candidate)) {
    candidate = `${candidate}:00`
  }

  const date = new Date(candidate)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString()
}

const DateTimeString = z.preprocess(normalizeDatetimeInput, z.string().datetime())
const NullableDateTimeString = z.preprocess(
  normalizeDatetimeInput,
  z.string().datetime().nullable()
)

export const SourceMessageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  provider: z.enum(['outlook', 'manual']),
  external_id: z.string().nullable(),
  folder: z.string().nullable(),
  subject: z.string(),
  sender_name: z.string().nullable(),
  sender_email: z.string().email(),
  received_at: NullableDateTimeString,
  body_text: z.string(),
  body_html: z.string().nullable(),
  created_at: DateTimeString,
})

export const SourceMessageCreateSchema = z.object({
  provider: z.enum(['outlook', 'manual']),
  external_id: z.string().optional().nullable(),
  folder: z.string().optional().nullable(),
  subject: z.string().min(1),
  sender_name: z.string().optional().nullable(),
  sender_email: z.string().email(),
  received_at: NullableDateTimeString.optional(),
  body_text: z.string().min(1),
  body_html: z.string().optional().nullable(),
})

export type SourceMessage = z.infer<typeof SourceMessageSchema>
export type SourceMessageCreate = z.infer<typeof SourceMessageCreateSchema>
