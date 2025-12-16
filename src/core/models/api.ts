/**
 * API Route Contracts and Zod Schemas
 * All request/response types for API routes
 */

import { z } from 'zod';

// ============================================================================
// Ingest APIs
// ============================================================================

// POST /api/ingest/outlook/sync
export const OutlookSyncRequestSchema = z.object({
  since: z.string().datetime().optional(), // ISO datetime, defaults to last sync
  folder: z.string().optional(), // Specific folder to sync
});

export const OutlookSyncResponseSchema = z.object({
  success: z.boolean(),
  messagesProcessed: z.number(),
  documentsProcessed: z.number(),
  errors: z.array(z.string()).optional(),
});

export type OutlookSyncRequest = z.infer<typeof OutlookSyncRequestSchema>;
export type OutlookSyncResponse = z.infer<typeof OutlookSyncResponseSchema>;

// POST /api/ingest/manual
export const ManualIngestRequestSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1),
  senderName: z.string().optional(),
  senderEmail: z.string().email().optional(),
  receivedAt: z.string().datetime().optional(), // defaults to now
});

export const ManualIngestResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().uuid(),
});

export type ManualIngestRequest = z.infer<typeof ManualIngestRequestSchema>;
export type ManualIngestResponse = z.infer<typeof ManualIngestResponseSchema>;

// POST /api/upload
export const UploadRequestSchema = z.object({
  filename: z.string(),
  mimeType: z.string(),
  sourceMessageId: z.string().uuid().optional(),
});

export const UploadResponseSchema = z.object({
  success: z.boolean(),
  documentId: z.string().uuid(),
  storagePath: z.string(),
  signedUrl: z.string().url().optional(), // For direct upload
});

export type UploadRequest = z.infer<typeof UploadRequestSchema>;
export type UploadResponse = z.infer<typeof UploadResponseSchema>;

// ============================================================================
// Extract APIs
// ============================================================================

// POST /api/extract/run
export const ExtractRunRequestSchema = z.object({
  sourceMessageId: z.string().uuid(),
  extractorVersion: z.string().default('v1'),
});

export const ExtractRunResponseSchema = z.object({
  success: z.boolean(),
  extractionId: z.string().uuid(),
  suggestionsCount: z.number(),
  suggestions: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['task', 'event', 'deadline']),
    title: z.string(),
    confidence: z.number(),
  })),
});

export type ExtractRunRequest = z.infer<typeof ExtractRunRequestSchema>;
export type ExtractRunResponse = z.infer<typeof ExtractRunResponseSchema>;

// ============================================================================
// Suggestions APIs
// ============================================================================

// GET /api/suggestions/list
export const SuggestionsListQuerySchema = z.object({
  state: z.enum(['new', 'approved', 'ignored', 'merged']).optional(),
  kidId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const SuggestionsListResponseSchema = z.object({
  suggestions: z.array(z.object({
    id: z.string().uuid(),
    extractionId: z.string().uuid(),
    type: z.enum(['task', 'event', 'deadline']),
    title: z.string(),
    description: z.string().nullable(),
    start_at: z.string().datetime().nullable(),
    end_at: z.string().datetime().nullable(),
    deadline_at: z.string().datetime().nullable(),
    location_text: z.string().nullable(),
    confidence: z.number(),
    suggested_kid_ids: z.array(z.string().uuid()).nullable(),
    suggested_activity_name: z.string().nullable(),
    state: z.enum(['new', 'approved', 'ignored', 'merged']),
    created_at: z.string().datetime(),
  })),
  total: z.number(),
});

export type SuggestionsListQuery = z.infer<typeof SuggestionsListQuerySchema>;
export type SuggestionsListResponse = z.infer<typeof SuggestionsListResponseSchema>;

// POST /api/suggestions/approve
export const SuggestionsApproveRequestSchema = z.object({
  suggestionIds: z.array(z.string().uuid()).min(1).max(50),
  edits: z.record(z.string().uuid(), z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    start_at: z.string().datetime().nullable().optional(),
    end_at: z.string().datetime().nullable().optional(),
    deadline_at: z.string().datetime().nullable().optional(),
    location_text: z.string().optional(),
    kidIds: z.array(z.string().uuid()).optional(),
    activityId: z.string().uuid().optional(),
  })).optional(),
  linkToKids: z.record(z.string().uuid(), z.array(z.string().uuid())).optional(),
  linkToActivity: z.record(z.string().uuid(), z.string().uuid()).optional(),
  linkToDocuments: z.record(z.string().uuid(), z.array(z.string().uuid())).optional(),
});

export const SuggestionsApproveResponseSchema = z.object({
  success: z.boolean(),
  familyItemIds: z.array(z.string().uuid()),
  linksCreated: z.number(),
});

export type SuggestionsApproveRequest = z.infer<typeof SuggestionsApproveRequestSchema>;
export type SuggestionsApproveResponse = z.infer<typeof SuggestionsApproveResponseSchema>;

// POST /api/suggestions/merge
export const SuggestionsMergeRequestSchema = z.object({
  suggestionIds: z.array(z.string().uuid()).min(2).max(10),
  mergedTitle: z.string().optional(),
  mergedDescription: z.string().optional(),
});

export const SuggestionsMergeResponseSchema = z.object({
  success: z.boolean(),
  mergedSuggestionId: z.string().uuid(),
});

export type SuggestionsMergeRequest = z.infer<typeof SuggestionsMergeRequestSchema>;
export type SuggestionsMergeResponse = z.infer<typeof SuggestionsMergeResponseSchema>;

// ============================================================================
// Items APIs (CRUD)
// ============================================================================

// GET /api/items
export const ItemsListQuerySchema = z.object({
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']).optional(),
  type: z.enum(['task', 'event', 'deadline']).optional(),
  kidId: z.string().uuid().optional(),
  activityId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const ItemsListResponseSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['task', 'event', 'deadline']),
    title: z.string(),
    description: z.string().nullable(),
    start_at: z.string().datetime().nullable(),
    end_at: z.string().datetime().nullable(),
    deadline_at: z.string().datetime().nullable(),
    status: z.enum(['open', 'done', 'snoozed', 'dismissed']),
    snooze_until: z.string().datetime().nullable(),
    checklist: z.array(z.object({
      text: z.string(),
      checked: z.boolean(),
    })).nullable(),
    tags: z.array(z.string()).nullable(),
    priority: z.number().int().min(1).max(5).nullable(),
    created_from: z.enum(['approved', 'manual', 'chat', 'imported_calendar']),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })),
  total: z.number(),
});

export type ItemsListQuery = z.infer<typeof ItemsListQuerySchema>;
export type ItemsListResponse = z.infer<typeof ItemsListResponseSchema>;

// POST /api/items
export const ItemCreateRequestSchema = z.object({
  type: z.enum(['task', 'event', 'deadline']),
  title: z.string().min(1),
  description: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().transform(val => val === '' ? undefined : val),
  start_at: z.union([
    z.string(),
    z.literal(''),
    z.null(),
    z.undefined()
  ]).optional().nullable().transform(val => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return null;
  }),
  end_at: z.union([
    z.string(),
    z.literal(''),
    z.null(),
    z.undefined()
  ]).optional().nullable().transform(val => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return null;
  }),
  deadline_at: z.union([
    z.string(),
    z.literal(''),
    z.null(),
    z.undefined()
  ]).optional().nullable().transform(val => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return null;
  }),
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']).default('open'),
  checklist: z.array(z.object({
    text: z.string(),
    checked: z.boolean().default(false),
  })).optional(),
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
  kidIds: z.array(z.string().uuid()).optional(),
  activityId: z.string().uuid().optional(),
  contactIds: z.array(z.string().uuid()).optional(),
  placeId: z.string().uuid().optional(),
});

export const ItemCreateResponseSchema = z.object({
  success: z.boolean(),
  itemId: z.string().uuid(),
});

export type ItemCreateRequest = z.infer<typeof ItemCreateRequestSchema>;
export type ItemCreateResponse = z.infer<typeof ItemCreateResponseSchema>;

// PUT /api/items/[id]
export const ItemUpdateRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  start_at: z.string().datetime().nullable().optional(),
  end_at: z.string().datetime().nullable().optional(),
  deadline_at: z.string().datetime().nullable().optional(),
  status: z.enum(['open', 'done', 'snoozed', 'dismissed']).optional(),
  snooze_until: z.string().datetime().nullable().optional(),
  checklist: z.array(z.object({
    text: z.string(),
    checked: z.boolean(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.number().int().min(1).max(5).optional(),
});

export const ItemUpdateResponseSchema = z.object({
  success: z.boolean(),
  itemId: z.string().uuid(),
});

export type ItemUpdateRequest = z.infer<typeof ItemUpdateRequestSchema>;
export type ItemUpdateResponse = z.infer<typeof ItemUpdateResponseSchema>;

// DELETE /api/items/[id]
export const ItemDeleteResponseSchema = z.object({
  success: z.boolean(),
});

export type ItemDeleteResponse = z.infer<typeof ItemDeleteResponseSchema>;

// ============================================================================
// Calendar APIs
// ============================================================================

// POST /api/calendar/apple/connect
export const AppleConnectRequestSchema = z.object({
  appleId: z.string().email(),
  appPassword: z.string().min(1), // Will be encrypted server-side
});

export const AppleConnectResponseSchema = z.object({
  success: z.boolean(),
  calendarsFound: z.number(),
});

export type AppleConnectRequest = z.infer<typeof AppleConnectRequestSchema>;
export type AppleConnectResponse = z.infer<typeof AppleConnectResponseSchema>;

// POST /api/calendar/apple/sync-read
export const AppleSyncReadRequestSchema = z.object({
  calendarUrl: z.string().url().optional(), // If not provided, sync all
  force: z.boolean().default(false),
});

export const AppleSyncReadResponseSchema = z.object({
  success: z.boolean(),
  calendarsSynced: z.number(),
  eventsSynced: z.number(),
});

export type AppleSyncReadRequest = z.infer<typeof AppleSyncReadRequestSchema>;
export type AppleSyncReadResponse = z.infer<typeof AppleSyncReadResponseSchema>;

// POST /api/calendar/apple/write
export const AppleWriteRequestSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  familyItemId: z.string().uuid(),
  calendarUrl: z.string().url(),
  confirmToken: z.string().optional(), // Required for execution after proposal
  // For create/update:
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  all_day: z.boolean().optional(),
  // For update/delete:
  uid: z.string().optional(),
  etag: z.string().optional(),
});

export const AppleWriteResponseSchema = z.object({
  success: z.boolean(),
  requiresConfirm: z.boolean(),
  confirmToken: z.string().optional(), // Returned if requiresConfirm=true
  calendarLinkId: z.string().uuid().optional(),
  uid: z.string().optional(),
});

export type AppleWriteRequest = z.infer<typeof AppleWriteRequestSchema>;
export type AppleWriteResponse = z.infer<typeof AppleWriteResponseSchema>;

// POST /api/calendar/apple/import
export const AppleImportRequestSchema = z.object({
  eventCacheIds: z.array(z.string().uuid()).min(1),
  kidIds: z.array(z.string().uuid()).optional(),
  activityId: z.string().uuid().optional(),
});

export const AppleImportResponseSchema = z.object({
  success: z.boolean(),
  familyItemIds: z.array(z.string().uuid()),
});

export type AppleImportRequest = z.infer<typeof AppleImportRequestSchema>;
export type AppleImportResponse = z.infer<typeof AppleImportResponseSchema>;

// ============================================================================
// Agent/Chat APIs
// ============================================================================

// POST /api/agent/chat
export const AgentChatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().uuid().optional(),
  confirmToken: z.string().optional(), // For confirming risky actions
});

export const AgentChatResponseSchema = z.object({
  response: z.string(),
  requiresConfirm: z.boolean(),
  confirmToken: z.string().optional(),
  pendingAction: z.object({
    type: z.string(),
    description: z.string(),
    riskLevel: z.enum(['low', 'medium', 'high']),
  }).optional(),
  toolCalls: z.array(z.object({
    tool: z.string(),
    result: z.any(),
  })).optional(),
});

export type AgentChatRequest = z.infer<typeof AgentChatRequestSchema>;
export type AgentChatResponse = z.infer<typeof AgentChatResponseSchema>;

// ============================================================================
// Actions/Undo APIs
// ============================================================================

// POST /api/actions/undo
export const UndoRequestSchema = z.object({
  agentActionId: z.string().uuid(),
});

export const UndoResponseSchema = z.object({
  success: z.boolean(),
  restored: z.boolean(),
});

export type UndoRequest = z.infer<typeof UndoRequestSchema>;
export type UndoResponse = z.infer<typeof UndoResponseSchema>;
