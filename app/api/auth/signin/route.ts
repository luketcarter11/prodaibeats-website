import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Mark this route as using the Edge runtime to avoid static prerendering
export const runtime = 'edge';

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
    
    // Create a response that we can update with cookies
    const response = new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: 'Processing authentication' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
    // Create a Supabase client using cookies for authenticated requests
    const cookieStore = cookies();
    const serverSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // This is for the server-side request-response lifecycle
            response.cookies.set({ 
              name, 
              value, 
              ...options, 
              // Explicitly set SameSite policy
              sameSite: options?.sameSite || 'lax'
            });
          },
          remove(name: string, options: any) {
            response.cookies.delete({ 
              name, 
              ...options, 
              // Explicitly set SameSite policy
              sameSite: options?.sameSite || 'lax' 
            });
          },
        },
      }
    );
    
    // Sign in user with the server-side client that can manage cookies
    const { data, error } = await serverSupabase.auth.signInWithPassword({
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
    
    // Create response data
    const responseBody = {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        // Don't send sensitive data to the client
      },
      message: 'Successfully signed in'
    };
    
    // Create a new response with all the cookies from the previous response
    const successResponse = NextResponse.json(responseBody);
    
    // Copy all cookies from the previous response
    response.cookies.getAll().forEach(cookie => {
      successResponse.cookies.set({
        name: cookie.name,
        value: cookie.value,
        // Make sure to pass all the cookie options
        path: cookie.path || '/',
        maxAge: cookie.maxAge,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite || 'lax'
      });
    });
    
    console.log('Login successful, cookies set');
    return successResponse;
  } catch (err: any) {
    console.error('Unexpected login error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 