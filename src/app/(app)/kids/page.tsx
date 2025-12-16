import { createClient } from '@/lib/supabase/server'
import { getKids } from '@/core/db/repositories/kids'
import KidList from '@/components/kids/KidList'
import Link from 'next/link'

export default async function KidsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  const kids = await getKids(user.id)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kids</h1>
        <Link
          href="/kids/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Kid
        </Link>
      </div>
      <KidList kids={kids} />
    </div>
  )
}
