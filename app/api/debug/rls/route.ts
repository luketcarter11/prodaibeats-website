import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'unavailable',
    message: 'The authentication system is currently being rebuilt. This API will be restored once the new authentication system is in place.',
    timestamp: new Date().toISOString()
  });
} 