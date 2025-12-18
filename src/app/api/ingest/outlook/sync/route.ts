import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOutlookCredentials, upsertOutlookCredentials } from '@/core/db/repositories/outlookCredentials'
import { getUserSettings } from '@/core/db/repositories/userSettings'
import { createSourceMessage } from '@/core/db/repositories/sourceMessages'
import { fetchOutlookMessages, refreshOutlookToken } from '@/core/ingest/outlook'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const creds = await getOutlookCredentials(user.id)
    if (!creds?.refresh_token) {
      return NextResponse.json({ error: 'Outlook not connected' }, { status: 400 })
    }

    let accessToken = creds.access_token
    const now = Date.now()
    const expiresAt = creds.expires_at ? new Date(creds.expires_at).getTime() : 0
    if (!accessToken || expiresAt - now < 60_000) {
      const refreshed = await refreshOutlookToken(creds.refresh_token)
      accessToken = refreshed.access_token
      const newExpires = new Date(now + refreshed.expires_in * 1000).toISOString()
      await upsertOutlookCredentials(user.id, {
        refresh_token: refreshed.refresh_token || creds.refresh_token,
        access_token: refreshed.access_token,
        expires_at: newExpires,
        token_type: refreshed.token_type,
        scope: refreshed.scope,
      })
    }

    const settings = await getUserSettings(user.id)
    const allowedSenders = (settings.approved_senders || []).map((e) => e.email.toLowerCase())

    const messages = await fetchOutlookMessages(accessToken, 25)
    let ingested = 0
    let skipped = 0

    for (const msg of messages) {
      const sender = msg.from?.emailAddress?.address?.toLowerCase?.() || ''
      if (allowedSenders.length && !allowedSenders.includes(sender)) {
        skipped++
        continue
      }

      const bodyText = msg.body?.content || msg.bodyPreview || ''
      if (!bodyText.trim()) {
        skipped++
        continue
      }

      await createSourceMessage(user.id, {
        provider: 'outlook',
        external_id: msg.id,
        folder: null,
        subject: msg.subject || '(no subject)',
        sender_name: msg.from?.emailAddress?.name || null,
        sender_email: sender || 'unknown@example.com',
        received_at: msg.receivedDateTime || new Date().toISOString(),
        body_text: bodyText,
        body_html: msg.body?.contentType === 'html' ? msg.body.content : null,
      })
      ingested++
    }

    return NextResponse.json({ success: true, ingestedCount: ingested, skippedCount: skipped })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
