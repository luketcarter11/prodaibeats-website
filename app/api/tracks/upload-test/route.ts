import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2 } from '@/lib/r2Uploader';
import path from 'path';
import fs from 'fs';

/**
 * API route to test R2 uploads
 */
export async function GET(request: NextRequest) {
  try {
    // Get a test file to upload
    const testFilePath = path.join(process.cwd(), 'public', 'favicon.ico');
    
    // Check if the file exists
    if (!fs.existsSync(testFilePath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Test file not found'
      }, { status: 404 });
    }
    
    // Upload to R2
    const r2Key = `test/favicon-${Date.now()}.ico`;
    const publicUrl = await uploadFileToR2(testFilePath, r2Key, 'image/x-icon');
    
    return NextResponse.json({ 
      success: true,
      message: 'Test file uploaded successfully',
      url: publicUrl 
    });
  } catch (error) {
    console.error('Upload test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 