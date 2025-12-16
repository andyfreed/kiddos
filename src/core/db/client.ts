import { createClient } from '@/lib/supabase/server';

export async function getSupabaseClient() {
  // Create a fresh client for each request (don't cache in server components)
  return await createClient();
}
