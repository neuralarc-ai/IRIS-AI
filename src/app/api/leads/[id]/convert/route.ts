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

// POST /api/leads/[id]/convert - Convert lead to account
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    // Check if lead exists and can be converted
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        )
      }
      console.error('Error checking lead:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check lead' },
        { status: 500 }
      )
    }

    // Validate lead can be converted
    if (existingLead.status === 'Converted to Account' || existingLead.status === 'Lost') {
      return NextResponse.json(
        { 
          error: 'Lead cannot be converted',
          details: `Lead status is "${existingLead.status}" and cannot be converted`
        },
        { status: 400 }
      )
    }

    // Check if account already exists for this lead
    const { data: existingAccount, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('converted_from_lead_id', id)
      .single()

    if (accountError && accountError.code !== 'PGRST116') {
      console.error('Error checking existing account:', accountError)
      return NextResponse.json(
        { error: 'Failed to check existing account' },
        { status: 500 }
      )
    }

    let accountId: string
    let accountData: any

    if (existingAccount) {
      // Account already exists, update it
      accountId = existingAccount.id
      const { data: updatedAccount, error: updateError } = await supabase
        .from('accounts')
        .update({
          status: 'Active',
          contact_email: existingLead.email || existingAccount.contact_email,
          contact_phone: existingLead.phone || existingAccount.contact_phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating existing account:', updateError)
        return NextResponse.json(
          { error: 'Failed to update existing account' },
          { status: 500 }
        )
      }

      accountData = updatedAccount
    } else {
      // Create new account
      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          name: existingLead.company_name,
          type: 'Client',
          status: 'Active',
          description: `Account converted from lead: ${existingLead.person_name} - ${existingLead.company_name}. LinkedIn: ${existingLead.linkedin_profile_url || 'N/A'}. Country: ${existingLead.country || 'N/A'}.`,
          contact_person_name: existingLead.person_name,
          contact_email: existingLead.email,
          contact_phone: existingLead.phone,
          converted_from_lead_id: id
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating new account:', createError)
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        )
      }

      accountId = newAccount.id
      accountData = newAccount
    }

    // Update lead status to Converted to Account
    const { data: updatedLead, error: leadUpdateError } = await supabase
      .from('leads')
      .update({
        status: 'Converted to Account',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (leadUpdateError) {
      console.error('Error updating lead status:', leadUpdateError)
      return NextResponse.json(
        { error: 'Failed to update lead status' },
        { status: 500 }
      )
    }

    // Log the conversion
    console.log(`Lead ${id} converted to account ${accountId}`)

    return NextResponse.json({
      message: 'Lead successfully converted to account',
      data: {
        lead: {
          id: updatedLead.id,
          company_name: updatedLead.company_name,
          person_name: updatedLead.person_name,
          previous_status: existingLead.status,
          new_status: updatedLead.status,
          updated_at: updatedLead.updated_at
        },
        account: {
          id: accountData.id,
          name: accountData.name,
          type: accountData.type,
          status: accountData.status,
          contactPersonName: accountData.contact_person_name,
          contactEmail: accountData.contact_email
        }
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