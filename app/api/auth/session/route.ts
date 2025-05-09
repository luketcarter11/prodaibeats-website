import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 400 });
    }
    
    // Return session data if available, otherwise null
    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.session?.user || null
    });
  } catch (err: any) {
    console.error('Session check error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 