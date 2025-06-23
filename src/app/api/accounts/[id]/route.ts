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

// GET /api/accounts/[id] - Get a specific account by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching account:', error)
      return NextResponse.json(
        { error: 'Failed to fetch account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/accounts/[id] - Update a specific account
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Validate type if provided
    if (body.type) {
      const validTypes = ['Client', 'Channel Partner']
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: 'Invalid type. Must be either "Client" or "Channel Partner"' },
          { status: 400 }
        )
      }
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

    // Check if account exists
    const { data: existingAccount, error: fetchError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        )
      }
      console.error('Error checking account:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check account' },
        { status: 500 }
      )
    }

    // Check if name is being updated and if it already exists
    if (body.name) {
      const { data: nameConflict } = await supabase
        .from('accounts')
        .select('id')
        .eq('name', body.name)
        .neq('id', id)
        .single()

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Account with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update account
    const { data, error } = await supabase
      .from('accounts')
      .update({
        name: body.name || undefined,
        type: body.type || undefined,
        status: body.status || undefined,
        description: body.description !== undefined ? body.description : undefined,
        contact_person_name: body.contact_person_name !== undefined ? body.contact_person_name : undefined,
        contact_email: body.contact_email !== undefined ? body.contact_email : undefined,
        contact_phone: body.contact_phone !== undefined ? body.contact_phone : undefined,
        industry: body.industry !== undefined ? body.industry : undefined
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating account:', error)
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Account updated successfully',
      data
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/accounts/[id] - Delete a specific account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Check if account exists and get converted_from_lead_id
    const { data: existingAccount, error: fetchError } = await supabase
      .from('accounts')
      .select('id, converted_from_lead_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        )
      }
      console.error('Error checking account:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check account' },
        { status: 500 }
      )
    }

    // If account was converted from a lead, update the lead status back
    if (existingAccount.converted_from_lead_id) {
      const { error: updateLeadError } = await supabase
        .from('leads')
        .update({ status: 'Qualified' })
        .eq('id', existingAccount.converted_from_lead_id)

      if (updateLeadError) {
        console.error('Error updating lead status:', updateLeadError)
        return NextResponse.json(
          { error: 'Failed to update lead status' },
          { status: 500 }
        )
      }
    }

    // Delete account
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting account:', error)
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Account deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 