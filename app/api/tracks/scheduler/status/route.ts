export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getScheduler } from '@/lib/models/Scheduler'

// Simple GET handler for debugging
export async function GET() {
  console.log('DEBUG: GET /api/tracks/scheduler/status called at', new Date().toISOString())
  
  return NextResponse.json({
    message: 'Scheduler status endpoint is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST() {
  const schedulerInstance = await getScheduler()
  
  // Get status using getStatus() method which exists in the Scheduler class
  return NextResponse.json(await schedulerInstance.getStatus())
} 