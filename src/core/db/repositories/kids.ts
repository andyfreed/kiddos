import { getSupabaseClient } from '../client';
import type { Kid, KidCreate, KidUpdate } from '@/core/models/kid';
import { KidSchema } from '@/core/models/kid';

export async function getKids(userId: string): Promise<Kid[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('kids')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(kid => KidSchema.parse(kid));
}

export async function getKidById(userId: string, kidId: string): Promise<Kid | null> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('kids')
    .select('*')
    .eq('id', kidId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return KidSchema.parse(data);
}

export async function createKid(userId: string, kid: KidCreate): Promise<Kid> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('kids')
    .insert({
      user_id: userId,
      ...kid,
    })
    .select()
    .single();

  if (error) throw error;
  return KidSchema.parse(data);
}

export async function updateKid(userId: string, kidId: string, updates: KidUpdate): Promise<Kid> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('kids')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', kidId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return KidSchema.parse(data);
}

export async function deleteKid(userId: string, kidId: string): Promise<void> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from('kids')
    .delete()
    .eq('id', kidId)
    .eq('user_id', userId);

  if (error) throw error;
}
