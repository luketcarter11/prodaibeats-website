import { NextRequest, NextResponse } from 'next/server'
import { getScheduler } from '@/lib/models/Scheduler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const active = Boolean(body.active)
    
    // Get fully initialized scheduler instance
    const schedulerInstance = await getScheduler()
    
    const result = await schedulerInstance.toggleActive(active)
    
    return NextResponse.json({
      active: result.active,
      nextRun: result.nextRun
    })
  } catch (error) {
    console.error('Error toggling scheduler:', error)
    return NextResponse.json(
      { error: 'Failed to toggle scheduler' },
      { status: 500 }
    )
  }
} 