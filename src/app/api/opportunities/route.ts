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
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('account_id') || searchParams.get('associated_account_id');

  let query = supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (accountId) {
    query = query.eq('associated_account_id', accountId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data }, { status: 200 });
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