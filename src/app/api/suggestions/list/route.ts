import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listSuggestions } from '@/core/db/repositories/suggestions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const suggestions = await listSuggestions(user.id, ['new'])
    return NextResponse.json({ suggestions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
