import { NextResponse } from 'next/server';
import { supabase, withApiKey } from '../../../../lib/supabaseClient';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, password, name } = await request.json();
    console.log('Signup attempt with email:', email, 'name:', name);
    
    // Validate input
    if (!email || !password) {
      console.log('Missing required fields');
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }
    
    // Create user in Supabase - using withApiKey to ensure API key is included
    const authResult = await withApiKey(async () => {
      console.log('Executing signup with withApiKey wrapper');
      return await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, name }, // Include both for compatibility
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.prodaibeats.com'}/auth/callback`,
        },
      });
    });
    
    const { data, error } = authResult;
    
    if (error) {
      console.error('Signup error details:', error);
      console.error('Signup error message:', error.message);
      console.error('Signup error status:', error.status);
      return NextResponse.json({
        success: false,
        message: error.message,
        error: error
      }, { status: error.status || 400 });
    }
    
    // Manual profile creation as a fallback in case triggers aren't working
    try {
      if (data?.user?.id) {
        console.log('User created, ID:', data.user.id);
        console.log('Checking if we need to create a profile...');
        
        // Check if profile already exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();
          
        if (profileCheckError && !existingProfile) {
          console.log('Profile does not exist, creating new profile...');
          
          // Create profile for new user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              full_name: name,
              updated_at: new Date().toISOString()
            });
            
          if (profileError) {
            console.error('Error creating profile:', profileError);
          } else {
            console.log('Profile created successfully');
          }
        } else {
          console.log('Profile already exists or check failed');
        }
      }
    } catch (profileErr) {
      console.error('Profile creation error:', profileErr);
      // Continue anyway, as the auth user was created
    }
    
    // Check if user was created but needs email confirmation
    if (data?.user && !data.user.identities?.[0]?.identity_data?.email_confirmed_at) {
      console.log('User created, needs email confirmation');
      return NextResponse.json({
        success: true,
        requiresEmailConfirmation: true,
        message: 'Account created! Please check your email to confirm your account.'
      });
    }
    
    // User was created and confirmed
    console.log('User created and confirmed');
    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: false,
      user: data.user,
      message: 'User successfully created'
    });
  } catch (err: any) {
    console.error('Unexpected signup error:', err);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred',
      error: err.message
    }, { status: 500 });
  }
} 