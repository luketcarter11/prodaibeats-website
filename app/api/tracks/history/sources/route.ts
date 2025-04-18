import { NextResponse } from 'next/server'
import { trackHistory } from '@/lib/models/TrackHistory'

export async function GET() {
  try {
    const sources = await trackHistory.getSources()
    
    return NextResponse.json({ sources })
  } catch (error) {
    console.error('Error getting track history sources:', error)
    return NextResponse.json(
      { error: 'Failed to get track history sources' },
      { status: 500 }
    )
  }
} 