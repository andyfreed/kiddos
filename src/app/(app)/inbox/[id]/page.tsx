import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSourceMessageById } from '@/core/db/repositories/sourceMessages'
import MessageDetail from '@/components/inbox/MessageDetail'

export default async function InboxMessagePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const message = await getSourceMessageById(user.id, params.id)
  if (!message) {
    notFound()
  }

  return <MessageDetail message={message} />
}
