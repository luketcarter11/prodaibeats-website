import { NextResponse } from 'next/server'
import { trackHistory } from '@/lib/models/TrackHistory'

export async function GET() {
  try {
    const csv = await trackHistory.exportToCSV()
    
    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv')
    headers.set('Content-Disposition', `attachment; filename="track-history-${new Date().toISOString().split('T')[0]}.csv"`)
    
    return new NextResponse(csv, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error exporting track history:', error)
    return NextResponse.json(
      { error: 'Failed to export track history' },
      { status: 500 }
    )
  }
} 