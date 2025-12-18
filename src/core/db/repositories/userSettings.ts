import { getSupabaseClient } from '../client'
import {
  ApprovedSendersSchema,
  ApprovedSenderEntrySchema,
  type ApprovedSenders,
  type ApprovedSenderEntry,
} from '@/core/models/api'

export async function getUserSettings(userId: string): Promise<ApprovedSenders> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('approved_senders, approved_sender_entries')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { approved_senders: [] }
    }
    throw error
  }

  const entriesRaw = (data as any)?.approved_sender_entries as unknown
  const emailsRaw = (data as any)?.approved_senders as string[] | undefined

  let approved_senders: ApprovedSenderEntry[] = []
  if (Array.isArray(entriesRaw) && entriesRaw.length) {
    approved_senders = entriesRaw
      .map((e) => {
        try {
          return ApprovedSenderEntrySchema.parse(e)
        } catch {
          return null
        }
      })
      .filter(Boolean) as ApprovedSenderEntry[]
  } else if (Array.isArray(emailsRaw) && emailsRaw.length) {
    approved_senders = emailsRaw.map((email) => ({ email, label: '' }))
  }

  return ApprovedSendersSchema.parse({ approved_senders })
}

export async function upsertUserSettings(userId: string, payload: ApprovedSenders): Promise<ApprovedSenders> {
  const parsed = ApprovedSendersSchema.parse(payload)
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      approved_senders: parsed.approved_senders.map((e) => e.email),
      approved_sender_entries: parsed.approved_senders,
    })
    .select('approved_senders, approved_sender_entries')
    .single()

  if (error) throw error
  const entries = (data as any)?.approved_sender_entries || []
  return ApprovedSendersSchema.parse({ approved_senders: entries })
}
