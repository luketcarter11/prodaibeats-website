import { NextRequest, NextResponse } from 'next/server';

// Edge and Streaming flags
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// An API route to check environment variables (masked for security)
export async function GET(request: NextRequest) {
  // Only show partial values for security
  const maskSecret = (secret?: string) => {
    if (!secret) return 'undefined';
    if (secret.length <= 4) return '****';
    return secret.substring(0, 2) + '****' + secret.substring(secret.length - 2);
  };

  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'undefined',
    VERCEL: process.env.VERCEL || 'undefined',
    VERCEL_ENV: process.env.VERCEL_ENV || 'undefined',
    SKIP_R2_INIT: process.env.SKIP_R2_INIT || 'undefined',
    // R2 config (masked)
    R2_ACCESS_KEY_ID: maskSecret(process.env.R2_ACCESS_KEY_ID),
    R2_SECRET_ACCESS_KEY: maskSecret(process.env.R2_SECRET_ACCESS_KEY),
    R2_ENDPOINT: process.env.R2_ENDPOINT ? 'Present' : 'undefined',
    R2_BUCKET: process.env.R2_BUCKET || 'undefined',
    NEXT_PUBLIC_STORAGE_BASE_URL: process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'undefined',
    // Other configs
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'undefined',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: maskSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };

  return NextResponse.json({
    environment: envVars,
    message: 'Environment variables check (masked for security)',
  });
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