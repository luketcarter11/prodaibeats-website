import { NextResponse } from 'next/server'
import { YouTubeDownloader } from '@/lib/YouTubeDownloader'

// Mark this route as dynamic to ensure it's not statically optimized
export const dynamic = 'force-dynamic'

// Simple GET handler for debugging
export async function GET() {
  console.log('GET /api/tracks/scheduler/run - Debug endpoint reached')
  return NextResponse.json({ message: "Run API endpoint is working", timestamp: new Date().toISOString() });
}

export async function POST() {
  try {
    // This is an asynchronous operation that may take time
    // We'll start it and return immediately
    const promise = YouTubeDownloader.runScheduler()
    
    // Set a timeout to avoid blocking the response
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => resolve({
        success: true,
        message: 'Scheduler run started in the background'
      }), 100)
    })
    
    // Return whichever resolves first (likely the timeout)
    const result = await Promise.race([promise, timeoutPromise])
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error running scheduler:', error)
    return NextResponse.json(
      { error: 'Failed to run scheduler' },
      { status: 500 }
    )
  }
} 