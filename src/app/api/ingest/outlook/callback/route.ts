import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeOutlookCode } from '@/core/ingest/outlook'
import { upsertOutlookCredentials } from '@/core/db/repositories/outlookCredentials'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect('/settings?error=unauthorized')

    const code = request.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.redirect('/settings?error=missing_code')

    const tokenResponse = await exchangeOutlookCode(code)

    const expires = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
    await upsertOutlookCredentials(user.id, {
      refresh_token: tokenResponse.refresh_token || '',
      access_token: tokenResponse.access_token,
      expires_at: expires,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope,
    })

    return NextResponse.redirect('/settings?outlook=connected')
  } catch (error: any) {
    console.error('Outlook callback error', error)
    return NextResponse.redirect(`/settings?error=${encodeURIComponent(error.message || 'outlook_error')}`)
  }
}
