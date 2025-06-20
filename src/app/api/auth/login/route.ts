import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are available
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase configuration is missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// POST /api/auth/login - Authenticate user with PIN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      );
    }

    // Find user by PIN
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('pin', pin)
      .eq('is_active', true)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Invalid PIN' },
          { status: 401 }
        );
      }
      console.error('Error checking user:', fetchError);
      return NextResponse.json(
        { error: 'Failed to authenticate' },
        { status: 500 }
      );
    }

    // Update last_login_at timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating last login:', updateError);
      // Don't fail the login if this update fails
    }

    // Transform user data to match the User interface
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      pin: user.pin,
      createdAt: user.created_at,
      role: user.role,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at
    };

    return NextResponse.json({
      message: 'Login successful',
      data: userData
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 