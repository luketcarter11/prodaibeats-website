import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '❌ Not set',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY
      ? '✅ Present'
      : '❌ Not set',
    R2_ENDPOINT: process.env.R2_ENDPOINT || '❌ Not set',
    R2_BUCKET: process.env.R2_BUCKET || '❌ Not set',
    NEXT_PUBLIC_STORAGE_BASE_URL: process.env.NEXT_PUBLIC_STORAGE_BASE_URL || '❌ Not set',
    NODE_ENV: process.env.NODE_ENV || '❌ Not set',
    VERCEL: process.env.VERCEL || '❌ Not set',
  });
} 