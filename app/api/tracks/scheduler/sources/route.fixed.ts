import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/models/Scheduler';
import { supabase } from '@/lib/supabaseClient';

// Add a new source - simplified implementation
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/tracks/scheduler/sources - Processing request');
    
    // Test Supabase connection
    if (!supabase) {
      console.error('❌ Supabase client is not available');
      return NextResponse.json(
        { error: 'Database client unavailable' },
        { status: 500 }
      );
    }
    
    // Use proper Supabase count syntax
    const { count, error: countError } = await supabase
      .from('scheduler_state')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Supabase connection test failed:', countError);
      return NextResponse.json(
        { error: 'Database connection error', details: countError },
        { status: 500 }
      );
    }
    
    console.log('✅ Supabase connection successful, table row count:', count);
    
    // Parse body
    const body = await request.json();
    console.log('📦 Request body:', body);
    
    const sourceUrl = body.source || body.url;
    if (!sourceUrl || !body.type) {
      return NextResponse.json(
        { error: 'Source URL and type are required' },
        { status: 400 }
      );
    }
    
    // Basic validation
    if (body.type !== 'channel' && body.type !== 'playlist') {
      return NextResponse.json(
        { error: 'Source type must be either "channel" or "playlist"' },
        { status: 400 }
      );
    }
    
    // Validate YouTube URL
    if (!sourceUrl.includes('youtube.com') && !sourceUrl.includes('youtu.be')) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }
    
    // Get scheduler
    try {
      const schedulerInstance = await getScheduler();
      const source = await schedulerInstance.addSource({
        source: sourceUrl,
        type: body.type
      });
      
      return NextResponse.json({ source });
    } catch (error) {
      console.error('❌ Error adding source:', error);
      return NextResponse.json(
        { error: 'Failed to add source', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Update a source
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      );
    }
    
    const schedulerInstance = await getScheduler();
    const updates: any = {};
    
    if (body.active !== undefined) {
      updates.active = Boolean(body.active);
    }
    
    const source = await schedulerInstance.updateSource(body.id, updates);
    
    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ source });
  } catch (error) {
    console.error('❌ Error updating source:', error);
    return NextResponse.json(
      { error: 'Failed to update source', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Delete a source
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      );
    }
    
    const schedulerInstance = await getScheduler();
    const success = await schedulerInstance.deleteSource(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting source:', error);
    return NextResponse.json(
      { error: 'Failed to delete source', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 