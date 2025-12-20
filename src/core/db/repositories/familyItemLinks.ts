import { getSupabaseClient } from '../client'
import { upsertActivityByName } from './activities'

export type FamilyItemLinkRow = {
  id: string
  user_id: string
  family_item_id: string
  kid_id: string | null
  activity_id: string | null
  contact_id: string | null
  place_id: string | null
  document_id: string | null
  source_message_id: string | null
  created_at: string
}

export async function listLinksForItem(userId: string, familyItemId: string): Promise<FamilyItemLinkRow[]> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('family_item_links')
    .select('*')
    .eq('user_id', userId)
    .eq('family_item_id', familyItemId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as FamilyItemLinkRow[]
}

export async function linkItemToKids(userId: string, familyItemId: string, kidIds: string[]) {
  const uniqueKids = Array.from(new Set(kidIds)).filter(Boolean)
  if (!uniqueKids.length) return { created: [] as FamilyItemLinkRow[] }

  const existing = await listLinksForItem(userId, familyItemId)
  const existingKidIds = new Set(existing.map((l) => l.kid_id).filter(Boolean) as string[])
  const toInsert = uniqueKids.filter((id) => !existingKidIds.has(id))

  if (!toInsert.length) return { created: [] as FamilyItemLinkRow[] }

  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('family_item_links')
    .insert(
      toInsert.map((kidId) => ({
        user_id: userId,
        family_item_id: familyItemId,
        kid_id: kidId,
      })),
    )
    .select('*')

  if (error) throw error
  return { created: (data || []) as FamilyItemLinkRow[] }
}

export async function unlinkItemFromKids(userId: string, familyItemId: string, kidIds: string[]) {
  const uniqueKids = Array.from(new Set(kidIds)).filter(Boolean)
  if (!uniqueKids.length) return { deleted: [] as FamilyItemLinkRow[] }

  const existing = await listLinksForItem(userId, familyItemId)
  const toDelete = existing.filter((l) => l.kid_id && uniqueKids.includes(l.kid_id))
  if (!toDelete.length) return { deleted: [] as FamilyItemLinkRow[] }

  const supabase = await getSupabaseClient()
  const { error } = await supabase
    .from('family_item_links')
    .delete()
    .eq('user_id', userId)
    .eq('family_item_id', familyItemId)
    .in('kid_id', uniqueKids)

  if (error) throw error
  return { deleted: toDelete }
}

export async function setItemActivity(params: {
  userId: string
  familyItemId: string
  activityId?: string | null
  activityName?: string | null
}) {
  const supabase = await getSupabaseClient()

  let activityId = params.activityId ?? null
  if (!activityId && params.activityName && params.activityName.trim()) {
    const activity = await upsertActivityByName(params.userId, params.activityName.trim())
    activityId = activity.id
  }
  if (!activityId) {
    throw new Error('Missing activityId or activityName')
  }

  // Remove any existing activity link(s) for this item, then create the new one.
  const existing = await listLinksForItem(params.userId, params.familyItemId)
  const existingActivityLinks = existing.filter((l) => !!l.activity_id)

  const { error: delError } = await supabase
    .from('family_item_links')
    .delete()
    .eq('user_id', params.userId)
    .eq('family_item_id', params.familyItemId)
    .not('activity_id', 'is', null)
  if (delError) throw delError

  const { data: created, error: insError } = await supabase
    .from('family_item_links')
    .insert({
      user_id: params.userId,
      family_item_id: params.familyItemId,
      activity_id: activityId,
    })
    .select('*')
    .single()
  if (insError) throw insError

  return {
    replaced: existingActivityLinks as FamilyItemLinkRow[],
    created: created as FamilyItemLinkRow,
  }
}

export async function clearItemActivity(userId: string, familyItemId: string) {
  const existing = await listLinksForItem(userId, familyItemId)
  const existingActivityLinks = existing.filter((l) => !!l.activity_id)
  if (!existingActivityLinks.length) return { deleted: [] as FamilyItemLinkRow[] }

  const supabase = await getSupabaseClient()
  const { error } = await supabase
    .from('family_item_links')
    .delete()
    .eq('user_id', userId)
    .eq('family_item_id', familyItemId)
    .not('activity_id', 'is', null)

  if (error) throw error
  return { deleted: existingActivityLinks as FamilyItemLinkRow[] }
}

