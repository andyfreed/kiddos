import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getKids, createKid } from '@/core/db/repositories/kids'
import { KidCreateSchema } from '@/core/models/kid'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const kids = await getKids(user.id)
    return NextResponse.json({ kids })
  } catch (error: any) {
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
    
    // Log for debugging (remove in production)
    console.log('Received body:', JSON.stringify(body, null, 2))
    
    const kidData = KidCreateSchema.parse(body)

    const kid = await createKid(user.id, kidData)
    return NextResponse.json({ kid }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Validation error:', error.errors)
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
