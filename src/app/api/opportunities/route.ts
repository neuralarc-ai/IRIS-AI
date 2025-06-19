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
    description,
    amount,
    status = 'Open',
    probability = 50,
    expected_close_date
  } = body;

  const { data, error } = await supabase
    .from('opportunities')
    .insert([{
      name,
      account_id: associated_account_id,
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

export async function GET() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data }, { status: 200 });
} 