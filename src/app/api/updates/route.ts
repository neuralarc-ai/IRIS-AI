import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received update data:', body);
    
    const {
      account_id,
      opportunity_id,
      lead_id,
      type,
      content,
      date,
      updated_by_user_id
    } = body;

    // Validate required fields
    if (!type || !content) {
      return NextResponse.json({ 
        error: 'Type and content are required' 
      }, { status: 400 });
    }

    // Ensure at least one entity is selected
    if (!account_id && !opportunity_id && !lead_id) {
      return NextResponse.json({ 
        error: 'At least one entity (account, opportunity, or lead) must be selected' 
      }, { status: 400 });
    }

    const updateData = {
      account_id: account_id || null,
      opportunity_id: opportunity_id || null,
      lead_id: lead_id || null,
      type,
      content,
      date: date || new Date().toISOString(),
      updated_by_user_id: updated_by_user_id || null
    };

    console.log('Inserting update data:', updateData);

    const { data, error } = await supabase
      .from('updates')
      .insert([updateData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('Successfully created update:', data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data }, { status: 200 });
} 