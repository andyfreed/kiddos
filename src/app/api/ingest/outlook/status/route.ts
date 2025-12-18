import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOutlookCredentials } from '@/core/db/repositories/outlookCredentials'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const creds = await getOutlookCredentials(user.id)
    if (!creds) {
      return NextResponse.json({ connected: false })
    }
    return NextResponse.json({
      connected: true,
      expires_at: creds.expires_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
