import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // 1. Direct supabase client session check
    const directSessionResult = await supabase.auth.getSession();
    
    // 2. Create a server client using cookies
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
            // This is only used for the response, not needed for GET
          },
          remove(name: string, options: any) {
            // This is only used for the response, not needed for GET
          },
        },
      }
    );
    
    const serverSessionResult = await serverSupabase.auth.getSession();
    
    // 3. List all cookies for debugging (sensitive data redacted)
    const availableCookies = cookieStore.getAll().map(cookie => ({
      name: cookie.name,
      // Don't expose actual values in production!
      hasValue: !!cookie.value,
    }));
    
    return NextResponse.json({
      success: true,
      directSession: {
        exists: !!directSessionResult.data.session,
        user: directSessionResult.data.session?.user ? {
          id: directSessionResult.data.session.user.id,
          email: directSessionResult.data.session.user.email,
          // Other user data redacted for safety
        } : null,
      },
      serverSession: {
        exists: !!serverSessionResult.data.session,
        user: serverSessionResult.data.session?.user ? {
          id: serverSessionResult.data.session.user.id,
          email: serverSessionResult.data.session.user.email,
          // Other user data redacted for safety
        } : null,
      },
      cookies: availableCookies,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Auth debug error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred during debug',
      error: err.message
    }, { status: 500 });
  }
} 