import { NextResponse } from 'next/server';
import { supabase, getSupabaseClient } from '../../../lib/supabaseClient';

// Define interfaces for our test results
interface TestResult {
  success: boolean;
  error: string | null;
}

// Safely get obscured API key for debugging
const obscureKey = (key: string | undefined) => {
  if (!key) return 'undefined';
  if (key.length < 8) return 'too_short';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

export async function GET(request: Request) {
  try {
    const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!originalSupabaseUrl,
      obscuredSupabaseUrl: obscureKey(originalSupabaseUrl),
      hasAnonKey: !!originalAnonKey,
      obscuredAnonKey: obscureKey(originalAnonKey),
      nodeEnv: process.env.NODE_ENV
    };
    
    // Test basic connection
    const connectionTest: TestResult = { success: false, error: null };
    try {
      // Try a simple request to see if Supabase connection works
      const { error } = await supabase.from('profiles').select('id').limit(1);
      connectionTest.success = !error;
      connectionTest.error = error ? error.message : null;
    } catch (e: any) {
      connectionTest.error = e.message;
    }
    
    // Test auth system
    const authTest: TestResult = { success: false, error: null };
    try {
      // Try to get auth settings to confirm API key works with auth
      const { data, error } = await supabase.auth.getSession();
      authTest.success = !error;
      authTest.error = error ? error.message : null;
    } catch (e: any) {
      authTest.error = e.message;
    }
    
    // Create fresh client and test it
    const freshClientTest: TestResult = { success: false, error: null };
    try {
      const freshClient = getSupabaseClient();
      const { error } = await freshClient.from('profiles').select('id').limit(1);
      freshClientTest.success = !error;
      freshClientTest.error = error ? error.message : null;
    } catch (e: any) {
      freshClientTest.error = e.message;
    }
    
    return NextResponse.json({
      status: 'ok',
      environment: envCheck,
      connectionTest,
      authTest,
      freshClientTest,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 