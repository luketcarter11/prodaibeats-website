import { NextRequest, NextResponse } from 'next/server'
import { scheduler, getScheduler } from '@/lib/models/Scheduler'
import { supabase } from '@/lib/supabaseClient'

// Add a new source
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/tracks/scheduler/sources - Processing request')
    
    // Check if supabase client is working
    try {
      console.log('🔄 Testing Supabase connection...')
      if (!supabase) {
        console.error('❌ Supabase client is not available')
        return NextResponse.json(
          { error: 'Database client unavailable' },
          { status: 500 }
        )
      }
      
      // Use proper Supabase count syntax with no auth required (RLS disabled)
      console.log('🧪 Testing access to scheduler_state table (RLS should be DISABLED)...')
      const { count, error } = await supabase
        .from('scheduler_state')
        .select('*', { count: 'exact', head: true })
        
      if (error) {
        console.error('❌ Supabase connection error:', error)
        console.error('Full error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        })
        console.error('💡 Try running these SQL commands to disable RLS:')
        console.error(`
DROP POLICY IF EXISTS scheduler_state_public_policy ON scheduler_state;
DROP POLICY IF EXISTS scheduler_state_select_policy ON scheduler_state;
DROP POLICY IF EXISTS scheduler_state_admin_policy ON scheduler_state;
ALTER TABLE scheduler_state DISABLE ROW LEVEL SECURITY;
        `)
        return NextResponse.json(
          { 
            error: 'Database connection error',
            details: error
          },
          { status: 500 }
        )
      }
      console.log('✅ Supabase connection successful, table row count:', count)
    } catch (connError) {
      console.error('❌ Unexpected Supabase connection error:', connError)
      console.error('Full error:', JSON.stringify(connError, Object.getOwnPropertyNames(connError)))
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: connError instanceof Error ? connError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
    
    // Parse body
    let body;
    try {
      body = await request.json()
      console.log('📦 Request body:', body)
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError)
      return NextResponse.json(
        { 
          error: 'Invalid request body', 
          details: parseError instanceof Error ? parseError.message : 'Could not parse JSON'
        },
        { status: 400 }
      )
    }
    
    const sourceUrl = body.source || body.url

    if (!sourceUrl || !body.type) {
      console.error('❌ Missing required fields:', { source: sourceUrl, type: body.type })
      return NextResponse.json(
        { error: 'Source URL and type are required' },
        { status: 400 }
      )
    }

    // Validate source type
    if (body.type !== 'channel' && body.type !== 'playlist') {
      console.error('❌ Invalid source type:', body.type)
      return NextResponse.json(
        { error: 'Source type must be either "channel" or "playlist"' },
        { status: 400 }
      )
    }

    // Validate source URL
    if (!isValidYouTubeUrl(sourceUrl)) {
      console.error('❌ Invalid YouTube URL:', sourceUrl)
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    // ✅ Get fully initialized scheduler instance
    const schedulerInstance = await getScheduler()
    console.log('✅ Scheduler instance ready, adding source...')

    try {
      const source = await schedulerInstance.addSource({
        source: sourceUrl,
        type: body.type
      })
      
      console.log('✅ Source added successfully:', source)
      return NextResponse.json({ source })
    } catch (sourceError) {
      console.error('❌ Error adding source:', sourceError)
      return NextResponse.json(
        { 
          error: 'Failed to add source',
          details: sourceError instanceof Error ? 
            { 
              message: sourceError.message,
              stack: sourceError.stack
            } : 'Unknown error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Unhandled error in POST /api/tracks/scheduler/sources:', error)
    // Log error details
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to add source',
        details: error instanceof Error ? 
          { 
            message: error.message,
            name: error.name
          } : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Update a source
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }

    // ✅ Get fully initialized scheduler instance
    const schedulerInstance = await getScheduler()

    const updates: any = {}
    if (body.active !== undefined) {
      updates.active = Boolean(body.active)
    }

    const source = await schedulerInstance.updateSource(body.id, updates)

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ source })
  } catch (error) {
    console.error('❌ Error updating source:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update source',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Delete a source
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }

    // ✅ Get fully initialized scheduler instance
    const schedulerInstance = await getScheduler()

    const success = await schedulerInstance.deleteSource(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting source:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete source',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ✅ YouTube URL validation helper
function isValidYouTubeUrl(url: string): boolean {
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('music.youtube.com')
  )
}
