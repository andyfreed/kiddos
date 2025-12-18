import { getSupabaseClient } from '../client'
import { ExtractionOutputSchema, type SuggestionFromExtraction } from '@/core/models/extraction'
import { SourceMessageSchema, type SourceMessage } from '@/core/models/sourceMessage'

export interface ExtractionRecord {
  id: string
  user_id: string
  source_message_id: string
  extractor_version: string
  input_snapshot: any
  output_raw: any
  created_at: string
}

export async function createExtractionWithSuggestions(params: {
  userId: string
  sourceMessage: SourceMessage
  extractorVersion: string
  inputSnapshot: any
  output: unknown
}): Promise<{ extraction: ExtractionRecord; suggestions: any[] }> {
  const supabase = await getSupabaseClient()
  const parsedOutput = ExtractionOutputSchema.parse(params.output)

  const { data: extractionRow, error: extractionError } = await supabase
    .from('extractions')
    .insert({
      user_id: params.userId,
      source_message_id: params.sourceMessage.id,
      extractor_version: params.extractorVersion,
      input_snapshot: params.inputSnapshot,
      output_raw: parsedOutput,
    })
    .select()
    .single()

  if (extractionError) throw extractionError
  const extraction: ExtractionRecord = extractionRow as any

  const suggestionPayloads = parsedOutput.suggestions.map((s: SuggestionFromExtraction) => ({
    user_id: params.userId,
    extraction_id: extraction.id,
    type: s.type,
    title: s.title,
    description: s.description ?? null,
    start_at: s.start_at ?? null,
    end_at: s.end_at ?? null,
    deadline_at: s.deadline_at ?? null,
    location_text: s.location_text ?? null,
    urls: s.urls ?? null,
    checklist: s.checklist ?? null,
    confidence: s.confidence,
    suggested_kid_ids: s.suggested_kid_ids ?? null,
    suggested_activity_name: s.suggested_activity_name ?? null,
    dedupe_key: s.dedupe_key,
    state: 'new',
  }))

  const { data: suggestions, error: suggestionsError } = await supabase
    .from('suggestions')
    .insert(suggestionPayloads)
    .select()

  if (suggestionsError) throw suggestionsError

  return { extraction, suggestions: suggestions || [] }
}

export async function getExtractionById(userId: string, extractionId: string): Promise<ExtractionRecord | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('extractions')
    .select('*')
    .eq('id', extractionId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as ExtractionRecord
}

export async function getSourceMessageForExtraction(userId: string, extractionId: string): Promise<SourceMessage | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('extractions')
    .select('source_message_id, source_messages(*)')
    .eq('id', extractionId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  const row: any = data
  if (!row?.source_messages) return null
  return SourceMessageSchema.parse(row.source_messages)
}
