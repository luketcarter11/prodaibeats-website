import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Initialize variables
let supabase: SupabaseClient
let isUsingServiceRoleKey = false

// Safely check for service role key without throwing build errors
const getServiceRoleKey = (): string | undefined => {
  // During build time on server, don't error out if key is missing
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('🔶 SUPABASE_SERVICE_ROLE_KEY not available during build phase - this is normal')
    return undefined
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

const supabaseServiceKey = getServiceRoleKey()

// Debug logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('✅ Supabase URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('✅ Supabase Anon Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('✅ Supabase Service Key available:', !!supabaseServiceKey)
}

// Client-side initialization (browser)
if (typeof window !== 'undefined') {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}
// Server-side initialization
else {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Try to use service role key for admin functions when available
    if (supabaseServiceKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
        isUsingServiceRoleKey = true
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔑 Using Supabase service role key (admin mode)')
        }
      } catch (error) {
        console.error('❌ Error initializing with service role key:', error)
        // Fallback to anon key
        supabase = createClient(supabaseUrl, supabaseAnonKey)
      }
    } else {
      // Use regular anon key for client-side requests
      supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔑 Using Supabase anon key (regular mode) - admin features will be limited')
      }
    }
  } else {
    // Fallback mock for server build environments
    supabase = {
      auth: {
        signUp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        signIn: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        user: () => null,
        session: () => null,
      },
      from: () => ({
        select: () => ({ data: null, error: new Error('Supabase not configured') }),
        insert: () => ({ data: null, error: new Error('Supabase not configured') }),
        update: () => ({ data: null, error: new Error('Supabase not configured') }),
        delete: () => ({ data: null, error: new Error('Supabase not configured') }),
      }),
    } as unknown as SupabaseClient
  }
}

// Create our function to check for service role key
// This relies on attempting an admin-only operation and seeing if it succeeds
const checkServiceRoleAccess = async (): Promise<boolean> => {
  try {
    // Try to access all auth users - this only works with service role key
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (error) {
      console.log('Service role check failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.log('Service role check exception:', error);
    return false;
  }
}

// Create an RPC function that can report whether we're using the service role key
// We'll create this after we deploy the SQL function to Supabase
const createCheckServiceRoleFunction = async () => {
  try {
    // Create an SQL function in Supabase to check for service role key
    const { error } = await supabase.rpc('create_service_role_check_function');
    if (error) {
      // Silently fail since this function might not exist yet
      console.log('Note: Service role check function not created yet. Run the SQL script first.');
    } else {
      console.log('Service role check function created successfully');
    }
  } catch (error) {
    // Silently fail since this is an optional feature
    console.log('Note: Service role check function not available. Run the SQL script first.');
  }
};

// If we're using the service role key, attempt to create the function
if (isUsingServiceRoleKey && typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // Wait a bit before trying to create the function to avoid startup errors
  setTimeout(() => {
    createCheckServiceRoleFunction();
  }, 5000);
}

export { supabase, isUsingServiceRoleKey, checkServiceRoleAccess, getServiceRoleKey }
