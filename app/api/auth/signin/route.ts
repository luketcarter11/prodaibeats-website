import { NextResponse } from 'next/server';
import { supabase, withApiKey } from '../../../../lib/supabaseClient';

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
    
    // Sign in user with Supabase
    const authResult = await withApiKey(async () => {
      return await supabase.auth.signInWithPassword({
        email,
        password
      });
    });
    
    const { data, error } = authResult;
    
    if (error) {
      console.error('Login error:', error.message);
      
      // Provide specific error messages for common issues
      if (error.message === 'Invalid login credentials') {
        return NextResponse.json({
          success: false,
          message: 'Invalid email or password. Please try again.'
        }, { status: 401 });
      } else if (error.message.includes('Email not confirmed')) {
        return NextResponse.json({
          success: false,
          message: 'Please confirm your email address before signing in.'
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
      user: data.user,
      message: 'Login successful'
    });
  } catch (err: any) {
    console.error('Unexpected login error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 