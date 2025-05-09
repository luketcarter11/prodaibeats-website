import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Explicitly use environment variables to create a client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // Simple validation
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase URL or Anon Key in environment variables',
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
      }, { status: 500 });
    }
    
    // Create a minimal client for testing
    const testClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'apikey': supabaseAnonKey
        }
      }
    });
    
    // Try a simple anon-level operation - public data fetch
    const { data, error } = await testClient
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Anon key test failed',
        error: error.message,
        details: error
      }, { status: 400 });
    }
    
    // Basic auth capabilities test - doesn't need to succeed
    const authResponse = await testClient.auth.getSession();
    
    return NextResponse.json({
      success: true,
      message: 'Anon key is properly configured',
      keyCheck: {
        // Show first and last few characters for verification
        anonKey: supabaseAnonKey.length > 10 
          ? `${supabaseAnonKey.substring(0, 4)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 4)}`
          : 'too_short',
        length: supabaseAnonKey.length
      },
      dataFetchTest: {
        success: !error,
        rowCount: data?.length || 0
      },
      authCapabilitiesTest: {
        success: !authResponse.error,
        error: authResponse.error ? authResponse.error.message : null
      }
    });
  } catch (err: any) {
    console.error('Test error:', err);
    return NextResponse.json({
      success: false,
      message: 'Error testing anon key',
      error: err.message
    }, { status: 500 });
  }
} 