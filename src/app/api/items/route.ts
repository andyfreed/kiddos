import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFamilyItems, createFamilyItem } from '@/core/db/repositories/familyItems'
import { ItemsListQuerySchema, ItemCreateRequestSchema } from '@/core/models/api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = ItemsListQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      kidId: searchParams.get('kidId') || undefined,
      activityId: searchParams.get('activityId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
    })

    const result = await getFamilyItems(user.id, query)
    return NextResponse.json(result)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Log for debugging
    console.log('Received item body:', JSON.stringify(body, null, 2))
    
    // Strip out any fields that shouldn't be in create request - do this aggressively
    const cleanBody: any = {}
    const allowedFields = ['type', 'title', 'description', 'start_at', 'end_at', 'deadline_at', 'status', 'checklist', 'tags', 'priority', 'kidIds', 'activityId', 'contactIds', 'placeId']
    
    for (const key of allowedFields) {
      if (key in body) {
        cleanBody[key] = body[key]
      }
    }
    
    console.log('Cleaned body:', JSON.stringify(cleanBody, null, 2))
    
    // Parse and validate
    const itemData = ItemCreateRequestSchema.parse(cleanBody)
    
    // Ensure all datetime fields are null instead of undefined
    const finalData = {
      ...itemData,
      start_at: itemData.start_at ?? null,
      end_at: itemData.end_at ?? null,
      deadline_at: itemData.deadline_at ?? null,
      priority: itemData.priority ?? null,
    }

    console.log('Final data for repository:', JSON.stringify(finalData, null, 2))

    const item = await createFamilyItem(user.id, finalData)
    return NextResponse.json({ success: true, itemId: item.id }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Validation error:', error.errors)
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
