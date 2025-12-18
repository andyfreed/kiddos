import { getSupabaseClient } from '../client'

export type AgentActionActor = 'ai' | 'user'

export interface AgentActionRow {
  id: string
  user_id: string
  actor: AgentActionActor
  action_type: string
  target_table: string
  target_id: string
  before_json: any | null
  after_json: any | null
  diff_json: any | null
  created_at: string
}

export async function logAgentAction(params: Omit<AgentActionRow, 'id' | 'created_at'>) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('agent_actions')
    .insert({
      user_id: params.user_id,
      actor: params.actor,
      action_type: params.action_type,
      target_table: params.target_table,
      target_id: params.target_id,
      before_json: params.before_json ?? null,
      after_json: params.after_json ?? null,
      diff_json: params.diff_json ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as AgentActionRow
}

export async function getAgentActionById(userId: string, id: string): Promise<AgentActionRow | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as AgentActionRow
}

