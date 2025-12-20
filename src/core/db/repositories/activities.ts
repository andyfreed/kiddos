import { getSupabaseClient } from '../client'
import { ActivitySchema } from '@/core/models/activity'
import type { Activity, ActivityCreate, ActivityUpdate } from '@/core/models/activity'

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export async function listActivities(userId: string, limit = 200): Promise<Activity[]> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
    .limit(limit)

  if (error) throw error
  return (data || []).map((row) => ActivitySchema.parse(row))
}

export async function getActivityById(userId: string, id: string): Promise<Activity | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data ? ActivitySchema.parse(data) : null
}

export async function findActivityByName(userId: string, name: string): Promise<Activity | null> {
  const normalized = normalizeName(name)
  if (!normalized) return null

  // PostgREST doesn't do case-insensitive equality without extensions;
  // keep it simple by scanning the user's activities (usually small).
  const activities = await listActivities(userId, 500)
  const wanted = normalized.toLowerCase()
  return activities.find((a) => normalizeName(a.name).toLowerCase() === wanted) || null
}

export async function createActivity(userId: string, input: ActivityCreate): Promise<Activity> {
  const supabase = await getSupabaseClient()
  const notes =
    input.notes === undefined || input.notes === null || String(input.notes).trim() === ''
      ? null
      : String(input.notes)
  const payload = {
    user_id: userId,
    name: normalizeName(input.name),
    default_place_id: input.default_place_id ?? null,
    default_checklist: input.default_checklist ?? null,
    notes,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('activities')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return ActivitySchema.parse(data)
}

export async function upsertActivityByName(userId: string, name: string): Promise<Activity> {
  const existing = await findActivityByName(userId, name)
  if (existing) return existing
  return await createActivity(userId, { name, notes: null })
}

export async function updateActivity(userId: string, id: string, updates: ActivityUpdate): Promise<Activity> {
  const supabase = await getSupabaseClient()

  const payload: any = {
    updated_at: new Date().toISOString(),
  }
  if (updates.name !== undefined) payload.name = normalizeName(updates.name)
  if (updates.default_place_id !== undefined) payload.default_place_id = updates.default_place_id
  if (updates.default_checklist !== undefined) payload.default_checklist = updates.default_checklist
  if (updates.notes !== undefined) payload.notes = updates.notes

  const { data, error } = await supabase
    .from('activities')
    .update(payload)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return ActivitySchema.parse(data)
}

export async function deleteActivity(userId: string, id: string): Promise<void> {
  const supabase = await getSupabaseClient()
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('user_id', userId)
    .eq('id', id)

  if (error) throw error
}

