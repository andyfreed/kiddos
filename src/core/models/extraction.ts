/**
 * Extraction Models and Zod Schemas
 */

import { z } from 'zod';

// Suggestion type from extraction
export const SuggestionFromExtractionSchema = z.object({
  type: z.enum(['task', 'event', 'deadline']),
  title: z.string().min(1),
  description: z.string().optional(),
  start_at: z.string().datetime().nullable().optional(),
  end_at: z.string().datetime().nullable().optional(),
  deadline_at: z.string().datetime().nullable().optional(),
  location_text: z.string().nullable().optional(),
  urls: z.array(z.string().url()).nullable().optional(),
  checklist: z.array(z.string()).nullable().optional(),
  confidence: z.number().min(0).max(1),
  suggested_kid_ids: z.array(z.string().uuid()).nullable().optional(),
  suggested_activity_name: z.string().nullable().optional(),
  dedupe_key: z.string().min(1),
  rationale: z.string().min(1),
});

// Full extraction output
export const ExtractionOutputSchema = z.object({
  suggestions: z.array(SuggestionFromExtractionSchema),
});

export type SuggestionFromExtraction = z.infer<typeof SuggestionFromExtractionSchema>;
export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;
