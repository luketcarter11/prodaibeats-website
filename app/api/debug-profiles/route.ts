import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to create a new admin client 
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'check';
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');
    
    // Get admin client with service role
    const supabase = getSupabaseAdmin();
    
    // Different actions for debugging
    switch (action) {
      case 'check': {
        // Count profiles
        const { data: countData, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });
          
        if (countError) {
          return NextResponse.json({ 
            error: `Error counting profiles: ${countError.message}`,
            details: countError
          }, { status: 500 });
        }
        
        // Get auth users count (requires service role)
        let authUsers = null;
        let authError = null;
        
        try {
          const { data, error } = await supabase.auth.admin.listUsers();
          authUsers = data.users;
          authError = error;
        } catch (e) {
          authError = e;
        }
        
        // Check for mismatched IDs
        let mismatchedProfiles = [];
        if (authUsers) {
          // Create a map of emails to auth IDs
          const authEmailMap = new Map();
          authUsers.forEach(user => {
            if (user.email) {
              authEmailMap.set(user.email.toLowerCase(), user.id);
            }
          });
          
          // Check for profiles with mismatched IDs
          if (countData) {
            mismatchedProfiles = countData.filter(profile => {
              if (!profile.email) return false;
              const authId = authEmailMap.get(profile.email.toLowerCase());
              return authId && authId !== profile.id;
            });
          }
        }
        
        return NextResponse.json({
          profilesCount: countData?.length || 0,
          authUsersCount: authUsers?.length || 0,
          mismatchedCount: mismatchedProfiles.length,
          mismatchedProfiles: mismatchedProfiles.map(p => ({
            profileId: p.id,
            email: p.email
          })),
          envCheck: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            nodeEnv: process.env.NODE_ENV
          }
        });
      }
      
      case 'fix-user': {
        if (!email && !userId) {
          return NextResponse.json({ 
            error: 'Either email or userId parameter is required for fix-user action'
          }, { status: 400 });
        }
        
        // Find the auth user
        let authUser = null;
        
        if (userId) {
          const { data, error } = await supabase.auth.admin.getUserById(userId);
          if (error) {
            return NextResponse.json({ 
              error: `Error fetching user by ID: ${error.message}`,
              details: error
            }, { status: 500 });
          }
          authUser = data.user;
        } else if (email) {
          // List all users and find by email (no direct getUserByEmail method)
          const { data, error } = await supabase.auth.admin.listUsers();
          if (error) {
            return NextResponse.json({ 
              error: `Error listing users: ${error.message}`,
              details: error
            }, { status: 500 });
          }
          
          authUser = data.users.find(u => 
            u.email?.toLowerCase() === email.toLowerCase()
          );
        }
        
        if (!authUser) {
          return NextResponse.json({ 
            error: 'Auth user not found'
          }, { status: 404 });
        }
        
        // Find existing profile by email
        const { data: existingProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email);
          
        if (profileError) {
          return NextResponse.json({ 
            error: `Error fetching profiles: ${profileError.message}`,
            details: profileError
          }, { status: 500 });
        }
        
        const existingProfile = existingProfiles && existingProfiles.length > 0 
          ? existingProfiles[0] 
          : null;
        
        // If profile exists but ID doesn't match, create a new profile with correct ID
        if (existingProfile && existingProfile.id !== authUser.id) {
          // Create a new profile with the correct ID
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: existingProfile.full_name,
              display_name: existingProfile.display_name,
              billing_address: existingProfile.billing_address,
              country: existingProfile.country,
              phone: existingProfile.phone,
              profile_picture_url: existingProfile.profile_picture_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();
            
          if (insertError) {
            return NextResponse.json({ 
              success: false,
              error: `Failed to create profile with correct ID: ${insertError.message}`,
              details: insertError
            }, { status: 500 });
          }
          
          return NextResponse.json({
            success: true,
            message: 'Fixed profile ID mismatch',
            oldProfile: existingProfile,
            newProfile: newProfile,
            authUser: {
              id: authUser.id,
              email: authUser.email
            }
          });
        }
        
        // If no profile exists, create a new one
        if (!existingProfile) {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();
            
          if (insertError) {
            return NextResponse.json({ 
              success: false,
              error: `Failed to create profile: ${insertError.message}`,
              details: insertError
            }, { status: 500 });
          }
          
          return NextResponse.json({
            success: true,
            message: 'Created new profile',
            newProfile: newProfile,
            authUser: {
              id: authUser.id,
              email: authUser.email
            }
          });
        }
        
        // Profile already exists with correct ID
        return NextResponse.json({
          success: true,
          message: 'Profile already exists with correct ID',
          profile: existingProfile,
          authUser: {
            id: authUser.id,
            email: authUser.email
          }
        });
      }
      
      default:
        return NextResponse.json({ 
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in debug-profiles API route:', error);
    return NextResponse.json({
      error: `An unexpected error occurred: ${(error as any).message}`,
      details: error
    }, { status: 500 });
  }
} 