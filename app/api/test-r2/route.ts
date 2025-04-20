import { r2Client, R2_BUCKET_NAME } from "@/lib/r2Config"; // Using our centralized r2Config
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Log environment variables for debugging
    console.log("R2 Direct Write Test:");
    console.log(`Bucket from env: ${process.env.R2_BUCKET}`);
    console.log(`Bucket from config: ${R2_BUCKET_NAME}`);
    console.log(`Has access key: ${!!process.env.R2_ACCESS_KEY_ID}`);
    console.log(`Has secret key: ${!!process.env.R2_SECRET_ACCESS_KEY}`);
    console.log(`Has endpoint: ${!!process.env.R2_ENDPOINT}`);
    
    // Create a test file with timestamp for uniqueness
    const timestamp = new Date().toISOString();
    const key = `scheduler/test-upload-${timestamp.replace(/[:.]/g, "-")}.json`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || R2_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify({ 
        hello: "world", 
        timestamp: timestamp,
        environment: process.env.NODE_ENV || "unknown",
        vercel: process.env.VERCEL || "not-on-vercel"
      }),
      ContentType: "application/json",
    });

    const result = await r2Client.send(command);

    return NextResponse.json({ 
      success: true, 
      message: "Successfully uploaded test file.",
      key: key,
      bucket: process.env.R2_BUCKET || R2_BUCKET_NAME,
      timestamp: timestamp,
      result: result
    });
  } catch (err: any) {
    console.error("R2 direct write error:", err);
    
    return NextResponse.json({
      success: false,
      error: err.message || "Unknown error",
      stack: err.stack,
      // Include some configuration info in the error response
      config: {
        bucketFromEnv: process.env.R2_BUCKET,
        bucketFromConfig: R2_BUCKET_NAME,
        hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
        hasEndpoint: !!process.env.R2_ENDPOINT
      }
    });
  }
} 