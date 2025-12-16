import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export async function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = await createClient();
  }
  return supabaseClient;
}
