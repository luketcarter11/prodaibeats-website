import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, password, name } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }
    
    // Create user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.prodaibeats.com'}/auth/callback`,
      },
    });
    
    if (error) {
      console.error('Signup error:', error.message);
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 400 });
    }
    
    // Check if user was created but needs email confirmation
    if (data?.user && !data.user.identities?.[0]?.identity_data?.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        requiresEmailConfirmation: true,
        message: 'Account created! Please check your email to confirm your account.'
      });
    }
    
    // User was created and confirmed
    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: false,
      user: data.user,
      message: 'User successfully created'
    });
  } catch (err: any) {
    console.error('Unexpected signup error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 