import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (!order.license_file) {
      return NextResponse.json(
        { error: 'License file not found' },
        { status: 404 }
      )
    }

    // Get license file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('licenses')
      .download(order.license_file)

    if (fileError) {
      console.error('Error downloading license:', fileError)
      return NextResponse.json(
        { error: 'Failed to download license' },
        { status: 500 }
      )
    }

    // Create response with file
    const response = new NextResponse(fileData)
    response.headers.set('Content-Type', 'application/pdf')
    response.headers.set('Content-Disposition', `inline; filename="license-${order.track_name}.pdf"`)
    
    return response
  } catch (error) {
    console.error('License error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 