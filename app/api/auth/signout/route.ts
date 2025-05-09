import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully signed out'
    });
  } catch (err: any) {
    console.error('Sign out error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 