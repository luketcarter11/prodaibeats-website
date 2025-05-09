import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET() {
  const results: Record<string, any> = {
    status: 'ok',
    tables: {},
    actions: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Check if service role is available for admin operations
    // Simple test by trying to access auth users list (admin-only)
    const { error: serviceRoleError } = await supabase.auth.admin.listUsers({ perPage: 1 });
    const hasServiceRole = !serviceRoleError;
    
    results.hasServiceRole = hasServiceRole;
    
    if (!hasServiceRole) {
      return NextResponse.json({
        status: 'error',
        message: 'Service role key is required for RLS checks',
        error: serviceRoleError
      }, { status: 403 });
    }
    
    // Check 'profiles' table structure
    const { data: profilesInfo, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    results.tables.profiles = {
      exists: !profilesError,
      error: profilesError ? profilesError.message : null,
      columns: profilesInfo ? Object.keys(profilesInfo[0] || {}) : []
    };
    
    // Check RLS policies on profiles table
    // This requires querying pg_policies as postgres superuser, which isn't possible from client
    // Instead, we'll try a test insert as an authenticated user to check if RLS is blocking
    
    try {
      // Create a test profile with a random ID
      const testUserId = `test-${Date.now()}`;
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: `test-${Date.now()}@example.com`,
          full_name: 'Test User',
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        results.tables.profiles.insertTest = {
          success: false,
          error: insertError.message,
          code: insertError.code,
          hint: 'May need RLS policy for INSERT',
        };
        
        // If it fails with permission denied, likely an RLS issue
        if (insertError.message.includes('permission denied')) {
          results.actions.push({
            action: 'Add RLS policy for profiles table',
            sql: `
              CREATE POLICY "Users can insert their own profile" 
              ON profiles FOR INSERT 
              WITH CHECK (auth.uid() = id);
              
              CREATE POLICY "Users can update own profile" 
              ON profiles FOR UPDATE
              USING (auth.uid() = id)
              WITH CHECK (auth.uid() = id);
              
              CREATE POLICY "Profiles are viewable by everyone" 
              ON profiles FOR SELECT
              USING (true);
            `
          });
        }
      } else {
        results.tables.profiles.insertTest = {
          success: true,
          message: 'Insert test passed'
        };
        
        // Clean up test profile
        await supabase
          .from('profiles')
          .delete()
          .eq('id', testUserId);
      }
    } catch (testError: any) {
      results.tables.profiles.insertTest = {
        success: false,
        error: testError.message
      };
    }
    
    // Check for handle_new_user function
    try {
      const { data: functions, error: functionsError } = await supabase.rpc('check_function_exists', { 
        function_name: 'handle_new_user' 
      });
      
      results.handle_new_user = {
        exists: functions?.exists || false,
        error: functionsError ? functionsError.message : null
      };
      
      if (!functions?.exists) {
        results.actions.push({
          action: 'Create handle_new_user function',
          sql: `
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS trigger
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $function$
            BEGIN
              INSERT INTO public.profiles (id, email, full_name, updated_at)
              VALUES (new.id, new.email, new.raw_user_meta_data->>'name', now());
              RETURN new;
            END;
            $function$;
            
            -- Create trigger if it doesn't exist
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
          `
        });
      }
    } catch (rpcError: any) {
      // Function to check if function exists doesn't exist itself
      results.handle_new_user = {
        exists: false,
        error: rpcError.message
      };
      
      results.actions.push({
        action: 'Create check_function_exists function',
        sql: `
          CREATE OR REPLACE FUNCTION check_function_exists(function_name text)
          RETURNS table(exists boolean)
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $function$
          BEGIN
            RETURN QUERY SELECT EXISTS (
              SELECT 1
              FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE p.proname = function_name
            );
          END;
          $function$;
        `
      });
    }
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('RLS debug error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      error
    }, { status: 500 });
  }
} 