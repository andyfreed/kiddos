import { getSupabaseClient } from '../client'

export interface OutlookCredentials {
  user_id: string
  refresh_token: string
  access_token: string | null
  expires_at: string | null
  token_type: string | null
  scope: string | null
  tenant_id: string | null
}

export async function getOutlookCredentials(userId: string): Promise<OutlookCredentials | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('outlook_credentials')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as OutlookCredentials
}

export async function upsertOutlookCredentials(userId: string, creds: Partial<OutlookCredentials>): Promise<OutlookCredentials> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('outlook_credentials')
    .upsert({
      user_id: userId,
      ...creds,
    })
    .select()
    .single()

  if (error) throw error
  return data as OutlookCredentials
}
