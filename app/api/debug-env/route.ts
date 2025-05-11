import { NextRequest, NextResponse } from 'next/server';

// Edge and Streaming flags
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Only allow this in development mode for security
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

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
  
  return NextResponse.json({
    status: 'unavailable',
    message: 'The authentication system is currently being rebuilt. This debug API will be restored once the new authentication system is in place.',
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
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