import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { licenses } from '../../../../lib/licenses'

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
  { params }: { params: { type: string } }
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

    const licenseType = decodeURIComponent(params.type)
    const licenseInfo = licenses[licenseType]

    if (!licenseInfo) {
      return NextResponse.json(
        { error: 'License template not found' },
        { status: 404 }
      )
    }

    // Redirect to the direct URL
    return NextResponse.redirect(licenseInfo.path)
  } catch (error) {
    console.error('License template error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 