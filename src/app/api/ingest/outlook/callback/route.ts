import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeOutlookCode } from '@/core/ingest/outlook'
import { upsertOutlookCredentials } from '@/core/db/repositories/outlookCredentials'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/settings?error=unauthorized', request.url))

    const code = request.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.redirect(new URL('/settings?error=missing_code', request.url))

    const tokenResponse = await exchangeOutlookCode(code)

    const expires = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
    await upsertOutlookCredentials(user.id, {
      refresh_token: tokenResponse.refresh_token || '',
      access_token: tokenResponse.access_token,
      expires_at: expires,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope,
    })

    return NextResponse.redirect(new URL('/settings?outlook=connected', request.url))
  } catch (error: any) {
    console.error('Outlook callback error', error)
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error.message || 'outlook_error')}`, request.url))
  }
}
