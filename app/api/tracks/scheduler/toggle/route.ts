import { NextRequest, NextResponse } from 'next/server'
import { scheduler } from '@/lib/models/Scheduler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const active = Boolean(body.active)
    
    const result = await scheduler.toggleActive(active)
    
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