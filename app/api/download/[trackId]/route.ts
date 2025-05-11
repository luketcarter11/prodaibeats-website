import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has purchased this track
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('track_id', params.trackId)
      .eq('status', 'completed')
      .limit(1)

    if (ordersError) {
      console.error('Error checking purchase:', ordersError)
      return NextResponse.json(
        { error: 'Failed to verify purchase' },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Track not purchased' },
        { status: 403 }
      )
    }

    // Generate signed URL for track download
    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from('tracks')
      .createSignedUrl(`${params.trackId}.mp3`, 300) // URL valid for 5 minutes

    if (signedUrlError) {
      console.error('Error generating download URL:', signedUrlError)
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: signedUrl.signedUrl })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 