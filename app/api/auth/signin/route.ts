import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }
    
    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Login error:', error);
      
      // Provide specific error messages for common issues
      if (error.message === 'Invalid login credentials') {
        return NextResponse.json({
          success: false,
          message: 'Invalid email or password'
        }, { status: 401 });
      } else if (error.message.includes('Email not confirmed')) {
        return NextResponse.json({
          success: false,
          message: 'Please confirm your email address before signing in'
        }, { status: 403 });
      }
      
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 400 });
    }
    
    // Login successful
    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user
    });
  } catch (err: any) {
    console.error('Unexpected login error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 