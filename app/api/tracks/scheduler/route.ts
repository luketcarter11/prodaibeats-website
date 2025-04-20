import { NextResponse } from "next/server";

// Mark this route as dynamic to ensure it's not statically optimized
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('GET /api/tracks/scheduler - Root scheduler endpoint reached');
  return NextResponse.json({ 
    message: "Scheduler root alive.",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/api/tracks/scheduler/status",
      "/api/tracks/scheduler/sources",
      "/api/tracks/scheduler/run",
      "/api/tracks/scheduler/toggle"
    ]
  });
} 