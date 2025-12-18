import { getSupabaseClient } from '../client'
import { ApprovedSendersSchema, type ApprovedSenders } from '@/core/models/api'

export async function getUserSettings(userId: string): Promise<ApprovedSenders> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('approved_senders')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { approved_senders: [] }
    }
    throw error
  }

  return ApprovedSendersSchema.parse(data || { approved_senders: [] })
}

export async function upsertUserSettings(userId: string, payload: ApprovedSenders): Promise<ApprovedSenders> {
  const parsed = ApprovedSendersSchema.parse(payload)
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      approved_senders: parsed.approved_senders,
    })
    .select('approved_senders')
    .single()

  if (error) throw error
  return ApprovedSendersSchema.parse(data)
}
