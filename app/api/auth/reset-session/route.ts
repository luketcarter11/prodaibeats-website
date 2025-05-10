import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get all cookie names
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('Resetting auth session, found cookies:', allCookies.map(c => c.name));
    
    // Clear all Supabase auth-related cookies by setting expiry in the past
    const authCookies = allCookies.filter(c => c.name.startsWith('sb-'));
    
    const response = NextResponse.json({
      success: true,
      message: 'Auth state reset',
      clearedCookies: authCookies.map(c => c.name)
    });
    
    // Clear each auth cookie
    for (const cookie of authCookies) {
      response.cookies.set({
        name: cookie.name,
        value: '',
        path: '/',
        expires: new Date(0), // Set to epoch time
        maxAge: 0
      });
      console.log(`Cleared cookie: ${cookie.name}`);
    }
    
    return response;
  } catch (error) {
    console.error('Error resetting auth state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset auth state' },
      { status: 500 }
    );
  }
} 