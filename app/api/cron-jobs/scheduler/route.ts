import { NextRequest, NextResponse } from 'next/server'
import { checkAndRunScheduler } from '@/lib/scheduler-job'

// Mark this route as dynamic since it uses request URL
export const dynamic = 'force-dynamic'

// This endpoint is designed to be called by a cron job service like cron-job.org
// It should be called every minute to check if the scheduler should run
export async function GET(request: NextRequest) {
  try {
    // Check for a secret key to prevent unauthorized access
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const secretKey = process.env.CRON_SECRET_KEY
    
    // If a secret key is set in .env, validate it
    if (secretKey && key !== secretKey) {
      console.error('Invalid or missing cron secret key')
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Start the scheduler check in the background without waiting for it to complete
    // This prevents timeout issues with cron job services
    (async () => {
      try {
        await checkAndRunScheduler()
      } catch (err) {
        console.error('Error in background scheduler execution:', err)
      }
    })()
    
    // Return success immediately
    return NextResponse.json({
      success: true,
      message: 'Scheduler check initiated'
    })
  } catch (error) {
    console.error('Error handling scheduler cron request:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error handling request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 