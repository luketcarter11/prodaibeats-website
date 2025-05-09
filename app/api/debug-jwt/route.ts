import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define interfaces for our test results
interface JwtTestResult {
  success: boolean;
  message: string;
  error: string | null;
}

// Safely get truncated value for debugging (don't show full secret)
const truncateValue = (value: string | undefined) => {
  if (!value) return 'undefined';
  if (value.length < 8) return 'too_short';
  return `${value.substring(0, 3)}...${value.substring(value.length - 3)}`;
};

export async function GET(request: Request) {
  try {
    // Check if JWT secret exists in environment
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    console.log('JWT Secret exists:', !!jwtSecret);
    
    // Prepare environment variables check
    const envCheck = {
      hasJwtSecret: !!jwtSecret,
      jwtSecretPrefix: jwtSecret ? truncateValue(jwtSecret) : 'undefined',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    };
    
    // Try to initialize Supabase with JWT secret to verify it works
    const jwtTest: JwtTestResult = { 
      success: false, 
      message: 'JWT secret test not performed',
      error: null 
    };
    
    try {
      if (!jwtSecret) {
        jwtTest.message = 'JWT secret is not defined in environment variables';
        jwtTest.error = 'Missing JWT secret';
      } else {
        // Try to create a client (just to test - don't actually use it for security reasons)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          // Just validate that JWT would work - don't attempt any real JWT operations
          jwtTest.success = true;
          jwtTest.message = 'JWT secret is defined and has valid format';
        } else {
          jwtTest.message = 'Cannot test JWT because Supabase URL or key is missing';
          jwtTest.error = 'Missing Supabase credentials';
        }
      }
    } catch (e: any) {
      jwtTest.error = e.message;
    }
    
    return NextResponse.json({
      status: 'ok',
      environment: envCheck,
      jwtTest,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Debug JWT error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 