import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase as supabaseClient } from '@/lib/supabaseClient'

// Initialize Supabase client
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || supabaseUrl === 'https://placeholder-url.supabase.co') {
    console.error('Supabase URL is not defined or is a placeholder')
    throw new Error('Supabase URL configuration issue')
  }
  
  if (!supabaseKey) {
    console.error('Supabase key is not defined')
    throw new Error('Supabase key configuration issue')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the ID is an order ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!orderError && order) {
      // This is an order ID - handle download like the orderId route
      // Get track file from storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('tracks')
        .download(`${order.track_id}.wav`)

      if (fileError) {
        console.error('Error downloading file:', fileError)
        return NextResponse.json(
          { error: 'Failed to download file' },
          { status: 500 }
        )
      }

      // Create response with file
      const response = new NextResponse(fileData)
      response.headers.set('Content-Type', 'audio/wav')
      response.headers.set('Content-Disposition', `attachment; filename="${order.track_name}.wav"`)
      
      return response
    } else {
      // This might be a track ID - handle download like the trackId route
      // Check if user has purchased this track
      const { data: orders, error: ordersError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('track_id', params.id)
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
      const { data: signedUrl, error: signedUrlError } = await supabaseClient
        .storage
        .from('tracks')
        .createSignedUrl(`${params.id}.mp3`, 300) // URL valid for 5 minutes

      if (signedUrlError) {
        console.error('Error generating download URL:', signedUrlError)
        return NextResponse.json(
          { error: 'Failed to generate download URL' },
          { status: 500 }
        )
      }

      return NextResponse.json({ url: signedUrl.signedUrl })
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 