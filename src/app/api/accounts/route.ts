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

// GET /api/accounts - Get all accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Get user info from headers
    const userId = request.headers.get('x-user-id');
    const isAdmin = request.headers.get('x-user-admin') === 'true';

    let query = supabase
      .from('accounts')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type)
    }

    // Filter by created_by_user_id if not admin
    if (!isAdmin && userId) {
      query = query.eq('created_by_user_id', userId);
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching accounts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
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

// POST /api/accounts - Create a new account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { name, type } = body
    
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['Client', 'Channel Partner']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be either "Client" or "Channel Partner"' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['Active', 'Inactive']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be either "Active" or "Inactive"' },
          { status: 400 }
        )
      }
    }

    // Check if account with same name already exists
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('name', name)
      .single()

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account with this name already exists' },
        { status: 409 }
      )
    }

    // Create new account
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name,
        type,
        status: body.status || 'Active',
        description: body.description || null,
        contact_person_name: body.contact_person_name || null,
        contact_email: body.contact_email || null,
        contact_phone: body.contact_phone || null,
        industry: body.industry || null,
        converted_from_lead_id: body.converted_from_lead_id || null,
        created_by_user_id: body.created_by_user_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating account:', error)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Account created successfully',
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