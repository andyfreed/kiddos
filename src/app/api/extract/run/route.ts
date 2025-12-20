import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExtractRunRequestSchema } from '@/core/models/api'
import { getSourceMessageById } from '@/core/db/repositories/sourceMessages'
import { getDocumentsBySourceMessage } from '@/core/db/repositories/documents'
import { getKids } from '@/core/db/repositories/kids'
import { listActivities, upsertActivityByName } from '@/core/db/repositories/activities'
import { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT_TEMPLATE, EXTRACTION_OUTPUT_SCHEMA } from '@/core/ai/prompts/extraction'
import { createExtractionWithSuggestions } from '@/core/db/repositories/extractions'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const input = ExtractRunRequestSchema.parse(body)

    const sourceMessage = await getSourceMessageById(user.id, input.sourceMessageId)
    if (!sourceMessage) return NextResponse.json({ error: 'Source message not found' }, { status: 404 })

    const documents = await getDocumentsBySourceMessage(user.id, input.sourceMessageId)
    const kids = await getKids(user.id)
    const activities = await listActivities(user.id)

    const promptUser = EXTRACTION_USER_PROMPT_TEMPLATE({
      emailSubject: sourceMessage.subject,
      emailBody: sourceMessage.body_text,
      senderName: sourceMessage.sender_name || '',
      senderEmail: sourceMessage.sender_email,
      receivedAt: sourceMessage.received_at || new Date().toISOString(),
      timezone: 'UTC',
      kids: kids.map((k) => ({ id: k.id, name: k.name, birthday: k.birthday || undefined, grade: k.grade || undefined })),
      activities: activities.map((a) => ({ id: a.id, name: a.name })),
      documentTexts: documents
        .filter((d) => !!d.text_content)
        .map((d) => ({ filename: d.filename, text: d.text_content || '' })),
    })

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: promptUser },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiRes.ok) {
      const text = await openaiRes.text()
      return NextResponse.json({ error: `OpenAI error: ${text}` }, { status: 500 })
    }

    const completion = await openaiRes.json() as any
    const content = completion.choices?.[0]?.message?.content
    if (!content) throw new Error('No content from OpenAI')

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch (err) {
      throw new Error('Failed to parse OpenAI JSON response')
    }

    const { extraction, suggestions } = await createExtractionWithSuggestions({
      userId: user.id,
      sourceMessage,
      extractorVersion: input.extractorVersion || 'v1',
      inputSnapshot: { sourceMessage, documents: documents.map((d) => ({ id: d.id, filename: d.filename })) },
      output: parsed,
    })

    // Best-effort: ensure any suggested activity names exist as activity templates
    try {
      const activityNames: string[] = (Array.isArray((parsed as any)?.suggestions) ? (parsed as any).suggestions : [])
        .map((s: any) => s?.suggested_activity_name)
        .filter((n: any): n is string => typeof n === 'string' && n.trim().length > 0)
      const unique: string[] = Array.from(new Set(activityNames.map((n) => n.trim())))
      for (const name of unique) {
        await upsertActivityByName(user.id, name)
      }
    } catch {
      // Ignore activity template creation failures; suggestions are still saved.
    }

    return NextResponse.json({
      success: true,
      extractionId: extraction.id,
      suggestions,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Extraction zod error', error.errors)
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Extraction error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
