import { createClient } from '@/lib/supabase/server'
import { getKidById } from '@/core/db/repositories/kids'
import { notFound } from 'next/navigation'
import KidDetail from '@/components/kids/KidDetail'

export default async function KidDetailPage({ params }: { params: { kidId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  const kid = await getKidById(user.id, params.kidId)

  if (!kid) {
    notFound()
  }

  return <KidDetail kid={kid} />
}
