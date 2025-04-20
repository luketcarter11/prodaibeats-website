import { r2Client } from '@/lib/r2Config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing R2 write with these credentials:');
    console.log(`R2_BUCKET: ${process.env.R2_BUCKET}`);
    console.log(`R2_ENDPOINT: ${process.env.R2_ENDPOINT}`);
    console.log(`R2_ACCESS_KEY_ID exists: ${!!process.env.R2_ACCESS_KEY_ID}`);
    console.log(`R2_SECRET_ACCESS_KEY exists: ${!!process.env.R2_SECRET_ACCESS_KEY}`);

    const result = await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: 'test-write.json',
        Body: JSON.stringify({ 
          test: true,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        }),
        ContentType: 'application/json',
      })
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully wrote to R2 storage',
      key: 'test-write.json',
      bucket: process.env.R2_BUCKET,
      result 
    });
  } catch (error) {
    console.error('R2 write error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as any).message,
      stack: (error as any).stack
    });
  }
} 