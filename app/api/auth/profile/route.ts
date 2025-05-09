import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

// Get profile for authenticated user
export async function GET() {
  try {
    // Get session first to get user ID
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }
    
    const userId = sessionData.session.user.id;
    
    // Get profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Profile retrieval error:', error);
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      profile: data
    });
  } catch (err: any) {
    console.error('Unexpected profile error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Update profile for authenticated user
export async function PATCH(request: Request) {
  try {
    // Get data to update
    const profileData = await request.json();
    
    // Get session first to get user ID
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }
    
    const userId = sessionData.session.user.id;
    
    // Ensure we can't update someone else's profile
    if (profileData.id && profileData.id !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Not authorized to update this profile'
      }, { status: 403 });
    }
    
    // Update timestamp
    const dataToUpdate = {
      ...profileData,
      updated_at: new Date().toISOString()
    };
    
    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(dataToUpdate)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      profile: data,
      message: 'Profile updated successfully'
    });
  } catch (err: any) {
    console.error('Unexpected profile update error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 