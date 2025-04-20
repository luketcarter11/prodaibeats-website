import { NextResponse } from 'next/server'
import { getScheduler } from '@/lib/models/Scheduler'

export async function GET() {
  try {
    // Get fully initialized scheduler instance
    const schedulerInstance = await getScheduler()
    
    // Get status from the initialized instance
    const status = schedulerInstance.getStatus()
    
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