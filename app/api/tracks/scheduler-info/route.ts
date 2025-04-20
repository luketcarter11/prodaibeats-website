import { NextResponse } from 'next/server'

// Mark this route as dynamic to ensure it's not statically optimized
export const dynamic = 'force-dynamic'

export async function GET() {
  // Log that this endpoint was reached
  console.log('GET /api/tracks/scheduler-info - Endpoint reached')
  
  // Return a list of available scheduler endpoints
  return NextResponse.json({
    message: "Scheduler API root endpoint is alive",
    availableEndpoints: [
      "/api/tracks/scheduler/run",
      "/api/tracks/scheduler/sources",
      "/api/tracks/scheduler/status",
      "/api/tracks/scheduler/toggle"
    ]
  })
} 