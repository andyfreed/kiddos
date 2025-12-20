import { z } from 'zod'

export const ListItemsArgsSchema = z.object({
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']).optional(),
  type: z.enum(['task', 'event', 'deadline']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const CreateItemArgsSchema = z.object({
  type: z.enum(['task', 'event', 'deadline']).default('task'),
  title: z.string().min(1),
  description: z.string().optional(),
  start_at: z.string().optional().nullable(),
  end_at: z.string().optional().nullable(),
  deadline_at: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(5).optional().nullable(),
})

export const UpdateItemArgsSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  start_at: z.string().optional().nullable(),
  end_at: z.string().optional().nullable(),
  deadline_at: z.string().optional().nullable(),
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']).optional(),
  priority: z.number().int().min(1).max(5).optional().nullable(),
})

export const DeleteItemArgsSchema = z.object({
  id: z.string().uuid(),
})

export const ListSuggestionsArgsSchema = z.object({
  state: z.enum(['new', 'approved', 'ignored', 'merged']).default('new'),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const ApproveSuggestionsArgsSchema = z.object({
  suggestionIds: z.array(z.string().uuid()).min(1).max(50),
})

export const RunExtractionArgsSchema = z.object({
  sourceMessageId: z.string().uuid(),
})

export const ListInboxArgsSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const ListKidsArgsSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const RenameKidArgsSchema = z.object({
  fromName: z.string().min(1),
  toName: z.string().min(1),
})

export const UpdateKidArgsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  birthday: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const DeleteKidArgsSchema = z.object({
  id: z.string().uuid(),
})

export const ListActivitiesArgsSchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional(),
})

export const CreateActivityArgsSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional().nullable(),
})

export const UpdateActivityArgsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
})

export const DeleteActivityArgsSchema = z.object({
  id: z.string().uuid(),
})

export type ToolName =
  | 'list_items'
  | 'create_item'
  | 'update_item'
  | 'delete_item'
  | 'list_inbox'
  | 'list_kids'
  | 'rename_kid'
  | 'update_kid'
  | 'delete_kid'
  | 'list_activities'
  | 'create_activity'
  | 'update_activity'
  | 'delete_activity'
  | 'list_suggestions'
  | 'approve_suggestions'
  | 'run_extraction'

export const OpenAITools = [
  {
    type: 'function',
    function: {
      name: 'list_items',
      description: 'List canonical family items (tasks/events/deadlines).',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'done', 'snoozed', 'dismissed'] },
          type: { type: 'string', enum: ['task', 'event', 'deadline'] },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_item',
      description: 'Create a canonical family item (task/event/deadline).',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['task', 'event', 'deadline'], default: 'task' },
          title: { type: 'string' },
          description: { type: 'string' },
          start_at: { type: ['string', 'null'] },
          end_at: { type: ['string', 'null'] },
          deadline_at: { type: ['string', 'null'] },
          priority: { type: ['integer', 'null'], minimum: 1, maximum: 5 },
        },
        required: ['title'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_item',
      description: 'Update a canonical family item. Date changes are considered risky and require confirmation.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: ['string', 'null'] },
          start_at: { type: ['string', 'null'] },
          end_at: { type: ['string', 'null'] },
          deadline_at: { type: ['string', 'null'] },
          status: { type: 'string', enum: ['open', 'done', 'snoozed', 'dismissed'] },
          priority: { type: ['integer', 'null'], minimum: 1, maximum: 5 },
        },
        required: ['id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_item',
      description: 'Delete a canonical family item (risky; requires confirmation).',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_inbox',
      description: 'List recent inbox source messages (emails/pastes).',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_kids',
      description: 'List kids for the current user.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rename_kid',
      description: 'Rename a kid by current name to a new name.',
      parameters: {
        type: 'object',
        properties: {
          fromName: { type: 'string' },
          toName: { type: 'string' },
        },
        required: ['fromName', 'toName'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_kid',
      description: 'Update a kid by id.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          birthday: { type: ['string', 'null'] },
          grade: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
        },
        required: ['id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_kid',
      description: 'Delete a kid (risky; requires confirmation).',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_activities',
      description: 'List activity templates for the current user.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 500 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_activity',
      description: 'Create an activity template (e.g. "Soccer practice").',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          notes: { type: ['string', 'null'] },
        },
        required: ['name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_activity',
      description: 'Update an activity template. Renames can affect matching.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          notes: { type: ['string', 'null'] },
        },
        required: ['id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_activity',
      description: 'Delete an activity template (risky; requires confirmation).',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_suggestions',
      description: 'List AI suggestions waiting for approval.',
      parameters: {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['new', 'approved', 'ignored', 'merged'], default: 'new' },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'approve_suggestions',
      description: 'Approve suggestions to create canonical items. Bulk > 5 requires confirmation.',
      parameters: {
        type: 'object',
        properties: {
          suggestionIds: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 50 },
        },
        required: ['suggestionIds'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_extraction',
      description: 'Run AI extraction for an inbox message to generate suggestions.',
      parameters: {
        type: 'object',
        properties: { sourceMessageId: { type: 'string' } },
        required: ['sourceMessageId'],
        additionalProperties: false,
      },
    },
  },
] as const
