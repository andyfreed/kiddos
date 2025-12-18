import { getSupabaseClient } from '../client';
import type { FamilyItem, FamilyItemCreate, FamilyItemUpdate } from '@/core/models/familyItem';
import { FamilyItemSchema } from '@/core/models/familyItem';

export interface FamilyItemsFilter {
  status?: 'open' | 'done' | 'snoozed' | 'dismissed';
  type?: 'task' | 'event' | 'deadline';
  kidId?: string;
  activityId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export async function getFamilyItems(userId: string, filter: FamilyItemsFilter = {}): Promise<{ items: FamilyItem[]; total: number }> {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from('family_items')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (filter.status) {
    query = query.eq('status', filter.status);
  }
  if (filter.type) {
    query = query.eq('type', filter.type);
  }
  if (filter.dateFrom) {
    query = query.gte('deadline_at', filter.dateFrom).or(`start_at.gte.${filter.dateFrom}`);
  }
  if (filter.dateTo) {
    query = query.lte('deadline_at', filter.dateTo).or(`start_at.lte.${filter.dateTo}`);
  }

  query = query.order('deadline_at', { ascending: true, nullsFirst: false })
    .order('start_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (filter.limit) {
    query = query.limit(filter.limit);
  }
  if (filter.offset) {
    query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  // If kidId or activityId filter, we need to join with links table
  if (filter.kidId || filter.activityId) {
    const linkQuery = supabase
      .from('family_item_links')
      .select('family_item_id')
      .eq('user_id', userId);

    if (filter.kidId) {
      linkQuery.eq('kid_id', filter.kidId);
    }
    if (filter.activityId) {
      linkQuery.eq('activity_id', filter.activityId);
    }

    const { data: links } = await linkQuery;
    const itemIds = new Set(links?.map(l => l.family_item_id) || []);

    const filteredData = data?.filter(item => itemIds.has(item.id)) || [];
    return {
      items: filteredData.map(item => FamilyItemSchema.parse(item)),
      total: filteredData.length,
    };
  }

  return {
    items: (data || []).map(item => FamilyItemSchema.parse(item)),
    total: count || 0,
  };
}

export async function getFamilyItemById(userId: string, itemId: string): Promise<FamilyItem | null> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('family_items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return FamilyItemSchema.parse(data);
}

export type FamilyItemCreatedFrom = 'approved' | 'manual' | 'chat' | 'imported_calendar'

export async function createFamilyItem(
  userId: string,
  item: FamilyItemCreate,
  createdFrom: FamilyItemCreatedFrom = 'manual'
): Promise<FamilyItem> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('family_items')
    .insert({
      user_id: userId,
      created_from: createdFrom,
      ...item,
    })
    .select()
    .single();

  if (error) throw error;
  return FamilyItemSchema.parse(data);
}

export async function updateFamilyItem(userId: string, itemId: string, updates: FamilyItemUpdate): Promise<FamilyItem> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('family_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return FamilyItemSchema.parse(data);
}

export async function deleteFamilyItem(userId: string, itemId: string): Promise<void> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from('family_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) throw error;
}
