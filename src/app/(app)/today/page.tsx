import { createClient } from '@/lib/supabase/server'
import { getFamilyItems } from '@/core/db/repositories/familyItems'
import ItemList from '@/components/items/ItemList'
import Link from 'next/link'

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  // Get items for today and next 2 days
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateTo = new Date(today)
  dateTo.setDate(dateTo.getDate() + 2)
  dateTo.setHours(23, 59, 59, 999)

  const { items } = await getFamilyItems(user.id, {
    status: 'open',
    dateFrom: today.toISOString(),
    dateTo: dateTo.toISOString(),
    limit: 50,
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Today</h1>
        <Link
          href="/items/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Item
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming (Next 2 Days)</h2>
        <ItemList initialItems={items} />
      </div>
    </div>
  )
}
