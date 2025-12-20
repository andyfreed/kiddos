import { getSupabaseClient } from '../client'
import { createFamilyItem } from './familyItems'
import { getExtractionById, getSourceMessageForExtraction } from './extractions'
import { upsertActivityByName } from './activities'
import type { FamilyItem } from '@/core/models/familyItem'

export interface SuggestionRow {
  id: string
  user_id: string
  extraction_id: string
  type: 'task' | 'event' | 'deadline'
  title: string
  description: string | null
  start_at: string | null
  end_at: string | null
  deadline_at: string | null
  location_text: string | null
  urls: string[] | null
  checklist: string[] | null
  confidence: number
  suggested_kid_ids: string[] | null
  suggested_activity_name: string | null
  dedupe_key: string
  state: 'new' | 'approved' | 'ignored' | 'merged'
  created_at: string
}

export async function listSuggestions(userId: string, state: SuggestionRow['state'][] = ['new']): Promise<SuggestionRow[]> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('suggestions')
    .select('*')
    .eq('user_id', userId)
    .in('state', state)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as SuggestionRow[]
}

export async function getSuggestionsByIds(userId: string, ids: string[]): Promise<SuggestionRow[]> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('suggestions')
    .select('*')
    .eq('user_id', userId)
    .in('id', ids)

  if (error) throw error
  return (data || []) as SuggestionRow[]
}

export async function approveSuggestions(params: {
  userId: string
  suggestionIds: string[]
}): Promise<{ familyItems: FamilyItem[] }> {
  if (!params.suggestionIds.length) {
    return { familyItems: [] }
  }

  const supabase = await getSupabaseClient()
  const suggestions = await getSuggestionsByIds(params.userId, params.suggestionIds)

  const familyItems: FamilyItem[] = []
  for (const sug of suggestions) {
    const item = await createFamilyItem(params.userId, {
      type: sug.type,
      title: sug.title,
      description: sug.description ?? undefined,
      start_at: sug.start_at,
      end_at: sug.end_at,
      deadline_at: sug.deadline_at,
      status: 'open',
      priority: null,
      checklist: sug.checklist
        ? sug.checklist.map((text) => ({ text, checked: false }))
        : undefined,
      tags: undefined,
    }, 'approved')
    familyItems.push(item)

    const linkRows: any[] = []

    // Link back to source message if possible
    const extraction = await getExtractionById(params.userId, sug.extraction_id)
    if (extraction?.source_message_id) {
      linkRows.push({
        user_id: params.userId,
        family_item_id: item.id,
        source_message_id: extraction.source_message_id,
      })
    }

    // Link to suggested kids (if the extractor provided UUIDs)
    if (Array.isArray(sug.suggested_kid_ids) && sug.suggested_kid_ids.length) {
      for (const kidId of sug.suggested_kid_ids) {
        linkRows.push({
          user_id: params.userId,
          family_item_id: item.id,
          kid_id: kidId,
        })
      }
    }

    // Link to an activity, creating it if needed
    if (sug.suggested_activity_name && sug.suggested_activity_name.trim()) {
      const activity = await upsertActivityByName(params.userId, sug.suggested_activity_name)
      linkRows.push({
        user_id: params.userId,
        family_item_id: item.id,
        activity_id: activity.id,
      })
    }

    if (linkRows.length) {
      const { error: linkError } = await supabase.from('family_item_links').insert(linkRows)
      if (linkError) throw linkError
    }
  }

  // Update suggestion state to approved
  const { error: updateError } = await supabase
    .from('suggestions')
    .update({ state: 'approved' })
    .eq('user_id', params.userId)
    .in('id', params.suggestionIds)

  if (updateError) throw updateError

  return { familyItems }
}
