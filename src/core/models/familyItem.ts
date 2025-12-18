import { z } from 'zod';

function normalizeDatetimeInput(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;

  let candidate = value.trim();
  if (!candidate) return value;

  // Common Postgres/Supabase variants that are ISO-like but not RFC3339.
  // - "2025-12-18 12:34:56+00"  -> "2025-12-18T12:34:56+00:00"
  // - "2025-12-18T12:34:56+0000" -> "2025-12-18T12:34:56+00:00"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(candidate)) {
    candidate = candidate.replace(' ', 'T');
  }
  if (/[+-]\d{4}$/.test(candidate)) {
    candidate = candidate.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  } else if (/[+-]\d{2}$/.test(candidate)) {
    candidate = `${candidate}:00`;
  }

  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}

const DateTimeString = z.preprocess(normalizeDatetimeInput, z.string().datetime());
const NullableDateTimeString = z.preprocess(
  normalizeDatetimeInput,
  z.string().datetime().nullable()
);

export const ChecklistItemSchema = z.object({
  text: z.string(),
  checked: z.boolean(),
});

export const FamilyItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(['task', 'event', 'deadline']),
  title: z.string().min(1),
  description: z.string().nullable(),
  start_at: NullableDateTimeString,
  end_at: NullableDateTimeString,
  deadline_at: NullableDateTimeString,
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']),
  snooze_until: NullableDateTimeString,
  checklist: z.array(ChecklistItemSchema).nullable(),
  tags: z.array(z.string()).nullable(),
  priority: z.number().int().min(1).max(5).nullable(),
  created_from: z.enum(['approved', 'manual', 'chat', 'imported_calendar']),
  created_at: DateTimeString,
  updated_at: DateTimeString,
});

export const FamilyItemCreateSchema = z.object({
  type: z.enum(['task', 'event', 'deadline']),
  title: z.string().min(1),
  description: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().nullable().transform(val => val === '' ? undefined : val),
  start_at: z.preprocess(
    (val) => {
      if (val === '' || val === undefined || val === null) return null;
      if (typeof val === 'string' && val.length > 0) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      return null;
    },
    z.union([z.string(), z.null()]).nullable()
  ).optional(),
  end_at: z.preprocess(
    (val) => {
      if (val === '' || val === undefined || val === null) return null;
      if (typeof val === 'string' && val.length > 0) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      return null;
    },
    z.union([z.string(), z.null()]).nullable()
  ).optional(),
  deadline_at: z.preprocess(
    (val) => {
      if (val === '' || val === undefined || val === null) return null;
      if (typeof val === 'string' && val.length > 0) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      return null;
    },
    z.union([z.string(), z.null()]).nullable()
  ).optional(),
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']).default('open'),
  checklist: z.array(ChecklistItemSchema).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.union([
    z.number().int().min(1).max(5),
    z.literal(''),
    z.null(),
    z.undefined()
  ]).optional().nullable().transform(val => {
    if (val === '' || val === undefined) return null;
    return val;
  }),
});

export const FamilyItemUpdateSchema = FamilyItemCreateSchema.partial().extend({
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']).optional(),
  snooze_until: z.string().datetime().optional().nullable(),
});

export type FamilyItem = z.infer<typeof FamilyItemSchema>;
export type FamilyItemCreate = z.infer<typeof FamilyItemCreateSchema>;
export type FamilyItemUpdate = z.infer<typeof FamilyItemUpdateSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
