import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Session error or no session:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the user is creating their own profile
    if (userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // First check if the profiles table exists
    console.log('Checking if profiles table exists...');
    let { error: tableCheckError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    // If table doesn't exist, try to create it
    if (tableCheckError && tableCheckError.code === 'PGRST109') {
      console.log('Profiles table does not exist, attempting to create it');
      
      // Try to use RPC to create the table
      const { error: rpcError } = await supabase.rpc('create_profiles_table');
      
      if (rpcError) {
        console.error('Failed to create profiles table:', rpcError);
        return NextResponse.json(
          { success: false, error: 'Failed to create profiles table' },
          { status: 500 }
        );
      }
      
      console.log('Successfully created profiles table');
    } else if (tableCheckError) {
      console.error('Error checking profiles table:', tableCheckError);
      return NextResponse.json(
        { success: false, error: 'Error checking profiles table' },
        { status: 500 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return NextResponse.json({
        success: true,
        profile: existingProfile,
        message: 'Profile already exists'
      });
    }

    // Create the profile
    console.log('Creating new profile for user:', userId);
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email || session.user.email,
        full_name: '',
        display_name: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    console.log('Profile created successfully');
    return NextResponse.json({
      success: true,
      profile: newProfile
    });
  } catch (error) {
    console.error('Unexpected error in create-profile route:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 