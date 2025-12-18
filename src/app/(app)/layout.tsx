import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/shared/NavBar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-dvh bg-gray-50 safe-bottom">
      <NavBar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {children}
      </main>
      <a
        href="/chat"
        className="fixed right-6 bottom-6 z-40 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
        aria-label="Open chat"
      >
        Chat
      </a>
    </div>
  )
}
