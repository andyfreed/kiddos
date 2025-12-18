import { getSupabaseClient } from '../client'

export interface DocumentRecord {
  id: string
  user_id: string
  source_message_id: string | null
  storage_path: string
  filename: string
  mime_type: string
  sha256: string | null
  text_content: string | null
  text_extracted_at: string | null
  extractor_version: string | null
  created_at: string
}

export async function getDocumentsBySourceMessage(userId: string, sourceMessageId: string): Promise<DocumentRecord[]> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .eq('source_message_id', sourceMessageId)

  if (error) throw error
  return (data || []) as DocumentRecord[]
}
