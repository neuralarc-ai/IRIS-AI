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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get user info from headers
    const userId = request.headers.get('x-user-id');
    const isAdmin = request.headers.get('x-user-admin') === 'true';

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }
    // Filter by created_by_user_id if not admin
    if (!isAdmin && userId) {
      query = query.or(`created_by_user_id.eq.${userId},assigned_user_id.eq.${userId}`);
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      total: count,
      page,
      limit,
      hasMore: count ? offset + limit < count : false
    })

  } catch (error) {
    console.error('Error in leads API:', error)
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
    
    console.log('📥 Received lead creation request:', body);
    console.log('📥 Request body type:', typeof body);
    console.log('📥 is_rejected value:', body.is_rejected);
    console.log('📥 is_rejected type:', typeof body.is_rejected);
    
    // Check if this is a rejected lead first
    const isRejected = body.is_rejected === true;
    console.log('🔍 isRejected determined:', isRejected);
    
    // Validate required fields only for non-rejected leads
    const { company_name, person_name, email } = body
    
    if (!isRejected) {
      // Only validate required fields for non-rejected leads
      if (!company_name || !person_name || !email) {
        console.error('❌ Missing required fields for non-rejected lead:', { company_name, person_name, email });
        return NextResponse.json(
          { error: 'Missing required fields: company_name, person_name, email' },
          { status: 400 }
        )
      }
    } else {
      // For rejected leads, only require company_name and person_name
      if (!company_name || !person_name) {
        console.error('❌ Missing required fields for rejected lead:', { company_name, person_name });
        return NextResponse.json(
          { error: 'Missing required fields: company_name, person_name' },
          { status: 400 }
        )
      }
      console.log('⚠️ Rejected lead - email validation skipped');
    }

    // Clean up email - remove any mailto: prefixes and extra formatting
    let cleanEmail = email?.trim() || '';
    if (cleanEmail.includes('mailto:')) {
      cleanEmail = cleanEmail.replace('mailto:', '').split(':')[0];
    }
    
    console.log('🧹 Cleaned email:', { original: email, cleaned: cleanEmail });

    if (!isRejected) {
      console.log('✅ Validating email for non-rejected lead');
      // Validate email format only for non-rejected leads
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        console.error('❌ Invalid email format:', cleanEmail);
        return NextResponse.json(
          { error: `Invalid email format: ${cleanEmail}` },
          { status: 400 }
        )
      }

      // Check if lead with same email already exists only for non-rejected leads
      console.log('🔍 Checking for duplicate email');
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', cleanEmail)
        .single()

      if (existingLead) {
        console.error('❌ Lead with email already exists:', cleanEmail);
        return NextResponse.json(
          { error: 'Lead with this email already exists' },
          { status: 409 }
        )
      }
    } else {
      console.log('⚠️ Skipping email validation for rejected lead:', cleanEmail);
    }

    const insertData = {
      company_name,
      person_name,
      email: cleanEmail || null, // Allow null for rejected leads
      phone: body.phone || null,
      linkedin_profile_url: body.linkedin_profile_url || null,
      country: body.country || null,
      status: body.status || 'New',
      created_by_user_id: body.created_by_user_id || null,
      is_rejected: isRejected
    };

    console.log('✅ Validation passed, creating lead with data:', insertData);
    console.log('📊 Insert data JSON:', JSON.stringify(insertData));

    // Create new lead
    const { data, error } = await supabase
      .from('leads')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating lead:', error)
      console.error('❌ Error details:', JSON.stringify(error))
      return NextResponse.json(
        { error: `Failed to create lead: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Lead created successfully:', data);
    console.log('✅ Created lead JSON:', JSON.stringify(data));

    return NextResponse.json(
      { 
        message: 'Lead created successfully',
        data 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 