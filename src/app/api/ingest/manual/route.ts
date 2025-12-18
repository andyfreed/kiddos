import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ManualIngestCreateSchema } from '@/core/models/api'
import { createSourceMessage } from '@/core/db/repositories/sourceMessages'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input = ManualIngestCreateSchema.parse(body)

    const nowIso = new Date().toISOString()
    const source = await createSourceMessage(user.id, {
      provider: 'manual',
      subject: input.subject,
      body_text: input.body,
      body_html: null,
      sender_email: input.senderEmail,
      sender_name: input.senderName || null,
      received_at: input.receivedAt || nowIso,
      external_id: null,
      folder: null,
    })

    return NextResponse.json({ success: true, sourceMessageId: source.id })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
