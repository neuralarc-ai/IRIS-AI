import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are available
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Supabase configuration is missing')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/leads - Get all leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Get user info from headers
    const userId = request.headers.get('x-user-id');
    const isAdmin = request.headers.get('x-user-admin') === 'true';

    let query = supabase
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }
    // Filter by created_by_user_id if not admin
    if (!isAdmin && userId) {
      query = query.eq('created_by_user_id', userId);
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      count,
      pagination: {
        limit,
        offset,
        hasMore: data.length === limit
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { company_name, person_name, email } = body
    
    if (!company_name || !person_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: company_name, person_name, email' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if lead with same email already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .single()

    if (existingLead) {
      return NextResponse.json(
        { error: 'Lead with this email already exists' },
        { status: 409 }
      )
    }

    // Create new lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        company_name,
        person_name,
        email,
        phone: body.phone || null,
        linkedin_profile_url: body.linkedin_profile_url || null,
        country: body.country || null,
        status: body.status || 'New',
        created_by_user_id: body.created_by_user_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Lead created successfully',
        data 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 