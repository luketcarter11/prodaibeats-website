import { NextResponse } from 'next/server'
import { YouTubeDownloader } from '@/lib/YouTubeDownloader'

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