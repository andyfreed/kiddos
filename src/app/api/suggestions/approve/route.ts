import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SuggestionsApproveRequestSchema } from '@/core/models/api'
import { approveSuggestions } from '@/core/db/repositories/suggestions'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = SuggestionsApproveRequestSchema.parse(body)

    const { familyItems } = await approveSuggestions({
      userId: user.id,
      suggestionIds: parsed.suggestionIds,
    })

    return NextResponse.json({ success: true, familyItemIds: familyItems.map((i) => i.id), linksCreated: familyItems.length })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
