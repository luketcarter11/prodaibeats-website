import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, password, full_name } = await request.json();
    
    // Validate input
    if (!email || !password || !full_name) {
      console.log('Missing required fields');
      return NextResponse.json({
        success: false,
        message: 'Email, password, and full name are required'
      }, { status: 400 });
    }
    
    // Create user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });
    
    if (error) {
      console.error('Signup error:', error);
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 400 });
    }
    
    // Profile creation happens automatically via database trigger
    console.log('User created successfully, profile should be created via trigger');
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      requiresEmailConfirmation: data?.user && !data.user.email_confirmed_at,
      user: data.user
    });
  } catch (err: any) {
    console.error('Unexpected signup error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 