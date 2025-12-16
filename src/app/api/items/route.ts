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
    
    // Strip out any fields that shouldn't be in create request
    const { created_at, updated_at, id, user_id, created_from, ...cleanBody } = body
    
    // Use passthrough to allow unknown fields but only validate what we care about
    const itemData = ItemCreateRequestSchema.passthrough().parse(cleanBody)
    
    // Now strip out any remaining unwanted fields before passing to repository
    const { created_at: _, updated_at: __, id: ___, user_id: ____, created_from: _____, ...finalData } = itemData as any

    const item = await createFamilyItem(user.id, itemData)
    return NextResponse.json({ success: true, itemId: item.id }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Validation error:', error.errors)
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
