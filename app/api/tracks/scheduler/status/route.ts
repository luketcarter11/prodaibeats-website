import { NextResponse } from 'next/server'
import { getScheduler } from '@/lib/models/Scheduler'

export const dynamic = 'force-dynamic'

// Return the actual scheduler status
export async function GET() {
  console.log('DEBUG: GET /api/tracks/scheduler/status called at', new Date().toISOString())
  
  try {
    // Get fully initialized scheduler instance
    const schedulerInstance = await getScheduler()
    
    // Get status from the initialized instance
    const status = schedulerInstance.getStatus()
    
    // Return the full status
    return NextResponse.json({
      active: status.active,
      nextRun: status.nextRun,
      interval: status.interval,
      sources: status.sources,
      logs: status.logs
    })
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    )
  }
}

export async function POST() {
  const schedulerInstance = await getScheduler()
  
  // Get status using getStatus() method which exists in the Scheduler class
  return NextResponse.json(await schedulerInstance.getStatus())
} 