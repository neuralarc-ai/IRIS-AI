import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase configuration is missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// POST /api/accounts/[id]/revert-to-lead - Revert an account back to a lead
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Fetch the account and check if it was converted from a lead
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (!account.converted_from_lead_id) {
      return NextResponse.json(
        { error: 'This account was not converted from a lead.' },
        { status: 400 }
      );
    }

    // Mark the account as inactive
    const { error: updateAccountError } = await supabase
      .from('accounts')
      .update({ status: 'Inactive', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateAccountError) {
      return NextResponse.json(
        { error: 'Failed to mark account as inactive.' },
        { status: 500 }
      );
    }

    // Update the original lead's status back to 'New'
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .update({ status: 'New', updated_at: new Date().toISOString() })
      .eq('id', account.converted_from_lead_id)
      .select()
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Failed to update lead status.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Account reverted to lead successfully.',
      data: {
        account: { id: account.id, status: 'Inactive' },
        lead: { id: lead.id, status: 'New' }
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 