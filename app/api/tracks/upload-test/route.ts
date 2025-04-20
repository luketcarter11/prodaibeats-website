import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2 } from '../../../../src/lib/r2Uploader';
import path from 'path';
import fs from 'fs';

/**
 * API route to test R2 uploads
 */
export async function GET(request: NextRequest) {
  try {
    // Get a test file to upload - try multiple paths
    let testFilePath = path.join(process.cwd(), 'public', 'favicon.ico');
    
    // Vercel deployment paths can vary, so we need to check alternatives
    if (!fs.existsSync(testFilePath)) {
      // Alternative path for Vercel
      testFilePath = path.join(process.cwd(), 'public', 'vercel.svg');
      
      if (!fs.existsSync(testFilePath)) {
        // Create a tiny test file if nothing else works
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        testFilePath = path.join(tempDir, 'test-file.txt');
        fs.writeFileSync(testFilePath, 'Test file for R2 upload', 'utf8');
        
        console.log('Created test file at:', testFilePath);
      } else {
        console.log('Using vercel.svg for test upload');
      }
    } else {
      console.log('Using favicon.ico for test upload');
    }
    
    // Upload to R2 with a unique timestamp
    const timestamp = Date.now();
    const r2Key = `test/upload-test-${timestamp}.txt`;
    
    console.log('Uploading file to R2:', testFilePath, '->', r2Key);
    const publicUrl = await uploadFileToR2(testFilePath, r2Key);
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Test file uploaded successfully',
      url: publicUrl,
      timestamp,
      file: path.basename(testFilePath)
    });
  } catch (error) {
    console.error('Upload test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
} 