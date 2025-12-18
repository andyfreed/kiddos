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
  const payload: any = {
    user_id: userId,
    ...creds,
  }

  // Mirror into legacy encrypted columns if they exist (schema from earlier migration)
  if ('access_token' in creds) {
    payload.access_token_encrypted = creds.access_token
  }
  if ('refresh_token' in creds) {
    payload.refresh_token_encrypted = creds.refresh_token
  }
  if ('expires_at' in creds) {
    payload.expires_at_encrypted = creds.expires_at
  }
  if ('token_type' in creds) {
    payload.token_type_encrypted = creds.token_type
  }

  const { data, error } = await supabase
    .from('outlook_credentials')
    .upsert(payload)
    .select()
    .single()

  if (error) throw error
  return data as OutlookCredentials
}
