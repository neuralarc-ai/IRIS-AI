import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only use the anon key and public URL from .env
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    associated_account_id,
    associated_lead_id,
    description,
    amount,
    status = 'Open',
    probability = 50,
    expected_close_date
  } = body;

  // Require at least one association
  if (!name || !amount || !expected_close_date || (!associated_account_id && !associated_lead_id)) {
    return NextResponse.json({ error: 'Missing required fields: name, amount, expected_close_date, and at least one of associated_account_id or associated_lead_id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert([{
      name,
      associated_account_id: associated_account_id || null,
      associated_lead_id: associated_lead_id || null,
      description,
      amount,
      status,
      probability,
      expected_close_date
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data }, { status: 201 });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const accountId = searchParams.get('account_id') || searchParams.get('associated_account_id');
    const status = searchParams.get('status');
    const userId = req.headers.get('x-user-id');
    const isAdmin = req.headers.get('x-user-admin') === 'true';

    let query = supabase
      .from('opportunities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (accountId) {
      query = query.eq('associated_account_id', accountId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // User-specific filtering for non-admins
    if (!isAdmin && userId) {
      // Get all accounts and leads assigned to or created by the user
      const [accountsRes, leadsRes] = await Promise.all([
        supabase.from('accounts').select('id').or(`created_by_user_id.eq.${userId},assigned_user_id.eq.${userId}`),
        supabase.from('leads').select('id').or(`created_by_user_id.eq.${userId},assigned_user_id.eq.${userId}`),
      ]);
      const userAccountIds = (accountsRes.data || []).map((a: any) => a.id);
      const userLeadIds = (leadsRes.data || []).map((l: any) => l.id);
      // Only show opportunities linked to user's accounts or leads
      query = query.or(
        [
          userAccountIds.length > 0 ? `associated_account_id.in.(${userAccountIds.join(',')})` : '',
          userLeadIds.length > 0 ? `associated_lead_id.in.(${userLeadIds.join(',')})` : ''
        ].filter(Boolean).join(',')
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching opportunities:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      total: count,
      page,
      limit,
      hasMore: count ? offset + limit < count : false
    }, { status: 200 });

  } catch (error) {
    console.error('Error in opportunities API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id, status' }, { status: 400 });
    }

    const VALID_STATUSES: string[] = ["Scope Of Work", "Proposal", "Negotiation", "Win", "Loss"];
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('opportunities')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating opportunity status:', error);
      // Handle case where opportunity is not found
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: `Opportunity with ID ${id} not found.` }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update opportunity status.' }, { status: 500 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Unexpected error in PATCH handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/opportunities?id=... - Delete an opportunity
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    // Check if opportunity exists before deleting
    const { data: existingOpportunity, error: fetchError } = await supabase
      .from('opportunities')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }
      console.error('Error checking opportunity:', fetchError);
      return NextResponse.json({ error: 'Failed to check opportunity' }, { status: 500 });
    }

    // Delete opportunity
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting opportunity:', error);
      return NextResponse.json({ error: 'Failed to delete opportunity' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Opportunity deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 