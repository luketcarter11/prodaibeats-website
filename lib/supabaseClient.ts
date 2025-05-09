import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || undefined

console.log('✅ Supabase URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('✅ Supabase Anon Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log('✅ Supabase Service Key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

// Flag to track if we're using the service role key
let isUsingServiceRoleKey = false

let supabase: SupabaseClient

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // Use service role key for admin functions when available
  if (supabaseServiceKey) {
    // Use service role key for admin operations - note this grants full DB access
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    isUsingServiceRoleKey = true
    console.log('🔑 Using Supabase service role key (admin mode)')
  } else {
    // Use regular anon key for client-side requests
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('🔑 Using Supabase anon key (regular mode) - admin features will be limited')
  }
} else if (typeof window !== 'undefined') {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
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
if (isUsingServiceRoleKey) {
  // Wait a bit before trying to create the function to avoid startup errors
  setTimeout(() => {
    createCheckServiceRoleFunction();
  }, 5000);
}

export { supabase, isUsingServiceRoleKey, checkServiceRoleAccess }
