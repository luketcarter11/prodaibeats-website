import { NextRequest, NextResponse } from 'next/server'
import { trackHistory } from '@/lib/models/TrackHistory'

// Mark this route as dynamic since it uses request parameters
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')
    const sourceId = request.nextUrl.searchParams.get('source') || 'all'
    const search = request.nextUrl.searchParams.get('search') || ''
    
    const result = await trackHistory.getTracks({
      page,
      limit,
      sourceId,
      search
    })
    
    return NextResponse.json({
      items: result.items,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page
    })
  } catch (error) {
    console.error('Error getting track history:', error)
    return NextResponse.json(
      { error: 'Failed to get track history' },
      { status: 500 }
    )
  }
} 