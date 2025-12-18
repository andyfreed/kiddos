import { NextRequest, NextResponse } from 'next/server'
import { buildOutlookAuthUrl } from '@/core/ingest/outlook'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const state = encodeURIComponent(`${user.id}:${Date.now()}`)
    const authUrl = buildOutlookAuthUrl(state)
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
