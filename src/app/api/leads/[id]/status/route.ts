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

// Valid lead statuses
const VALID_STATUSES = ['New', 'Qualified', 'Contacted', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost', 'Unqualified']

// PATCH /api/leads/[id]/status - Update lead status
export async function PATCH(
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

    // Validate request body
    const { status, notes, updated_by } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: 'Invalid status value',
          validStatuses: VALID_STATUSES 
        },
        { status: 400 }
      )
    }

    // Check if lead exists
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

    // Business logic for status transitions
    const currentStatus = existingLead.status
    const newStatus = status

    // Validate status transition
    const isValidTransition = validateStatusTransition(currentStatus, newStatus)
    if (!isValidTransition.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid status transition',
          details: isValidTransition.reason,
          currentStatus,
          newStatus
        },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Add notes if provided
    if (notes) {
      updateData.notes = notes
    }

    // Add updated_by if provided
    if (updated_by) {
      updateData.updated_by = updated_by
    }

    // Add status change timestamp for converted status
    if (newStatus === 'Converted') {
      updateData.converted_at = new Date().toISOString()
    }

    // Update lead status
    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead status:', error)
      return NextResponse.json(
        { error: 'Failed to update lead status' },
        { status: 500 }
      )
    }

    // Log status change for audit trail
    console.log(`Lead ${id} status changed from ${currentStatus} to ${newStatus}`)

    return NextResponse.json({
      message: 'Lead status updated successfully',
      data: {
        id: data.id,
        company_name: data.company_name,
        person_name: data.person_name,
        previous_status: currentStatus,
        new_status: data.status,
        updated_at: data.updated_at
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

// Helper function to validate status transitions
function validateStatusTransition(currentStatus: string, newStatus: string): { valid: boolean; reason?: string } {
  // Define valid status transitions
  const validTransitions: { [key: string]: string[] } = {
    'New': ['Qualified', 'Contacted', 'Unqualified'],
    'Qualified': ['Contacted', 'Proposal Sent', 'Unqualified'],
    'Contacted': ['Qualified', 'Proposal Sent', 'Negotiation', 'Unqualified'],
    'Proposal Sent': ['Negotiation', 'Converted', 'Lost'],
    'Negotiation': ['Converted', 'Lost', 'Proposal Sent'],
    'Converted': [], // Final status - no further transitions
    'Lost': [], // Final status - no further transitions
    'Unqualified': [] // Final status - no further transitions
  }

  // Check if transition is valid
  const allowedTransitions = validTransitions[currentStatus] || []
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from '${currentStatus}' to '${newStatus}'. Valid transitions: ${allowedTransitions.join(', ')}`
    }
  }

  return { valid: true }
} 