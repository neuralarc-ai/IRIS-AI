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

// POST /api/leads/bulk-assign - Bulk assign leads to a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadIds, assignedUserId } = body

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Lead IDs array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!assignedUserId) {
      return NextResponse.json(
        { error: 'Assigned user ID is required' },
        { status: 400 }
      )
    }

    // Verify the user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', assignedUserId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Get current assignments to track changes
    const { data: currentLeads } = await supabase
      .from('leads')
      .select('id, assigned_user_id')
      .in('id', leadIds)

    // Update all leads with the new assignment
    const { data, error } = await supabase
      .from('leads')
      .update({ 
        assigned_user_id: assignedUserId,
        updated_at: new Date().toISOString()
      })
      .in('id', leadIds)
      .select()

    if (error) {
      console.error('Error bulk assigning leads:', error)
      return NextResponse.json(
        { error: 'Failed to assign leads' },
        { status: 500 }
      )
    }

    // Create notifications for newly assigned leads
    const notifications = currentLeads
      ?.filter(lead => lead.assigned_user_id !== assignedUserId)
      .map(lead => ({
        user_id: assignedUserId,
        message: `You have been assigned a new lead: ${lead.id}`,
        lead_id: lead.id,
        created_at: new Date().toISOString()
      })) || []

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json({
      message: `Successfully assigned ${data.length} leads to ${user.name}`,
      data: {
        assignedLeads: data,
        assignedUser: user,
        notificationCount: notifications.length
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