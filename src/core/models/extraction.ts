/**
 * Extraction Models and Zod Schemas
 */

import { z } from 'zod';

function normalizeDatetimeInput(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  let candidate = value.trim();
  if (!candidate) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(candidate)) candidate = candidate.replace(' ', 'T');
  if (/[+-]\d{4}$/.test(candidate)) candidate = candidate.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  if (/[+-]\d{2}$/.test(candidate)) candidate = `${candidate}:00`;
  const d = new Date(candidate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const NullableDateTime = z.preprocess(normalizeDatetimeInput, z.string().datetime().nullable());

// Suggestion type from extraction
export const SuggestionFromExtractionSchema = z.object({
  type: z.enum(['task', 'event', 'deadline']),
  title: z.string().min(1),
  description: z.string().optional(),
  start_at: NullableDateTime.optional(),
  end_at: NullableDateTime.optional(),
  deadline_at: NullableDateTime.optional(),
  location_text: z.string().nullable().optional(),
  urls: z.array(z.string()).nullable().optional(),
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
