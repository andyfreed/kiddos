import { getSupabaseClient } from '../client'
import { SourceMessageSchema, SourceMessageCreateSchema } from '@/core/models/sourceMessage'
import type { SourceMessage, SourceMessageCreate } from '@/core/models/sourceMessage'

export async function listSourceMessages(userId: string, limit = 50): Promise<SourceMessage[]> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('source_messages')
    .select('*')
    .eq('user_id', userId)
    .order('received_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map((row) => SourceMessageSchema.parse(row))
}

export async function getSourceMessageById(userId: string, id: string): Promise<SourceMessage | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('source_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data ? SourceMessageSchema.parse(data) : null
}

export async function getSourceMessageByExternalId(userId: string, externalId: string): Promise<SourceMessage | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('source_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('external_id', externalId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data ? SourceMessageSchema.parse(data) : null
}

export async function createSourceMessage(userId: string, input: SourceMessageCreate): Promise<SourceMessage> {
  const parsed = SourceMessageCreateSchema.parse(input)
  const supabase = await getSupabaseClient()

  // If external_id provided, avoid duplicates
  if (parsed.external_id) {
    const existing = await getSourceMessageByExternalId(userId, parsed.external_id)
    if (existing) return existing
  }

  const { data, error } = await supabase
    .from('source_messages')
    .insert({
      user_id: userId,
      ...parsed,
    })
    .select()
    .single()

  if (error) throw error
  return SourceMessageSchema.parse(data)
}
