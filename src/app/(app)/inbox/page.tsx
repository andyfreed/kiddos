import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listSourceMessages } from '@/core/db/repositories/sourceMessages'
import ManualIngestForm from '@/components/inbox/ManualIngestForm'
import MessageList from '@/components/inbox/MessageList'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const messages = await listSourceMessages(user.id, 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inbox</h1>
      </div>
      <ManualIngestForm />
      <MessageList messages={messages} />
    </div>
  )
}
