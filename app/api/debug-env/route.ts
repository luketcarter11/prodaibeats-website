import { NextRequest, NextResponse } from 'next/server';

// Edge and Streaming flags
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // URL parameters for authentication
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    // Very basic security - compare with a fixed value
    // This is not secure for production, but helps avoid casual access
    if (token !== 'debug-prodai-2024') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check for environment variables (don't expose actual values)
    const envStatus = {
      node_env: process.env.NODE_ENV || 'not set',
      supabase_url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabase_url_valid: process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-url.supabase.co',
      supabase_anon_key: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabase_service_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      stripe_key: Boolean(process.env.STRIPE_SECRET_KEY),
      timestamp: new Date().toISOString(),
      runtime: 'edge'
    };
    
    return NextResponse.json(envStatus);
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export function POST() {
  return methodNotAllowed();
}

export function PUT() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}

export function PATCH() {
  return methodNotAllowed();
}

// Helper function for method not allowed response
function methodNotAllowed() {
  return NextResponse.json(
    { error: 'Method not allowed. Only GET requests are accepted.' },
    { 
      status: 405,
      headers: {
        'Allow': 'GET'
      }
    }
  );
} 