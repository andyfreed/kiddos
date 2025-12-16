import { z } from 'zod';

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
  start_at: z.string().datetime().nullable(),
  end_at: z.string().datetime().nullable(),
  deadline_at: z.string().datetime().nullable(),
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']),
  snooze_until: z.string().datetime().nullable(),
  checklist: z.array(ChecklistItemSchema).nullable(),
  tags: z.array(z.string()).nullable(),
  priority: z.number().int().min(1).max(5).nullable(),
  created_from: z.enum(['approved', 'manual', 'chat', 'imported_calendar']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const FamilyItemCreateSchema = z.object({
  type: z.enum(['task', 'event', 'deadline']),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  start_at: z.string().datetime().optional().nullable(),
  end_at: z.string().datetime().optional().nullable(),
  deadline_at: z.string().datetime().optional().nullable(),
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']).default('open'),
  checklist: z.array(ChecklistItemSchema).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.number().int().min(1).max(5).optional().nullable(),
});

export const FamilyItemUpdateSchema = FamilyItemCreateSchema.partial().extend({
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']).optional(),
  snooze_until: z.string().datetime().optional().nullable(),
});

export type FamilyItem = z.infer<typeof FamilyItemSchema>;
export type FamilyItemCreate = z.infer<typeof FamilyItemCreateSchema>;
export type FamilyItemUpdate = z.infer<typeof FamilyItemUpdateSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
