import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UndoRequestSchema } from '@/core/models/api'
import { getAgentActionById } from '@/core/db/repositories/agentActions'
import { deleteFamilyItem, updateFamilyItem } from '@/core/db/repositories/familyItems'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = UndoRequestSchema.parse(body)

    const action = await getAgentActionById(user.id, parsed.agentActionId)
    if (!action) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (action.target_table !== 'family_items') {
      return NextResponse.json({ error: 'Undo not supported for this action' }, { status: 400 })
    }

    if (action.action_type === 'create_family_item') {
      await deleteFamilyItem(user.id, action.target_id)
      return NextResponse.json({ success: true, restored: true })
    }

    if (action.action_type === 'update_family_item') {
      const before = action.before_json
      if (!before || before.id !== action.target_id) {
        return NextResponse.json({ error: 'Missing before state' }, { status: 400 })
      }
      await updateFamilyItem(user.id, action.target_id, {
        title: before.title,
        description: before.description,
        start_at: before.start_at,
        end_at: before.end_at,
        deadline_at: before.deadline_at,
        status: before.status,
        priority: before.priority,
        checklist: before.checklist,
        tags: before.tags,
        snooze_until: before.snooze_until,
      } as any)
      return NextResponse.json({ success: true, restored: true })
    }

    return NextResponse.json({ error: 'Undo not supported for this action' }, { status: 400 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

