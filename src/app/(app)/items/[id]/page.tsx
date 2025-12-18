import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFamilyItemById } from '@/core/db/repositories/familyItems'
import ItemDetail from '@/components/items/ItemDetail'

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const item = await getFamilyItemById(user.id, params.id)

  if (!item) {
    notFound()
  }

  return <ItemDetail item={item} />
}
