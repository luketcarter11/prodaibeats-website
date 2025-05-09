import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Remove placeholder fallbacks that might cause issues in production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('❌ Required Supabase environment variables are missing!')
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file')
  }
}

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
  console.log('✅ Supabase URL available:', !!supabaseUrl)
  console.log('✅ Supabase Anon Key available:', !!supabaseAnonKey)
  console.log('✅ Supabase Service Key available:', !!supabaseServiceKey)
}

// Common options to ensure API key is properly included
const commonOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'X-Client-Info': 'prodai-beats'
    }
  }
}

// Client-side initialization (browser)
if (typeof window !== 'undefined') {
  try {
    // Explicitly use global headers to ensure API key is included
    supabase = createClient(supabaseUrl, supabaseAnonKey, commonOptions)
    console.log('✅ Supabase client initialized for browser')
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error)
    throw error // Re-throw to make the error visible
  }
}
// Server-side initialization
else {
  if (supabaseUrl && supabaseAnonKey) {
    // Try to use service role key for admin functions when available
    if (supabaseServiceKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseServiceKey, {
          ...commonOptions,
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          global: {
            headers: {
              'apikey': supabaseServiceKey,
              'X-Client-Info': 'prodai-beats-server'
            }
          }
        })
        isUsingServiceRoleKey = true
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔑 Using Supabase service role key (admin mode)')
        }
      } catch (error) {
        console.error('❌ Error initializing with service role key:', error)
        // Fallback to anon key
        supabase = createClient(supabaseUrl, supabaseAnonKey, commonOptions)
      }
    } else {
      // Use regular anon key for client-side requests
      supabase = createClient(supabaseUrl, supabaseAnonKey, commonOptions)
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔑 Using Supabase anon key (regular mode) - admin features will be limited')
      }
    }
  } else {
    // Throw an error for missing config instead of creating a mock
    throw new Error('Supabase URL and Anon Key must be provided in environment variables')
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

// Helper function to execute an async function with explicit API key headers
export async function withApiKey<T>(fn: () => Promise<T>): Promise<T> {
  // Create direct headers object with API key for auth calls
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!apiKey) {
    console.error('Missing API key for authentication');
  }
  
  const authHeaders = {
    apikey: apiKey,
    'Content-Type': 'application/json'
  };
  
  // Save original fetch
  const originalFetch = global.fetch;
  
  // Override fetch to include API key in all requests during execution
  global.fetch = async (url, options = {}) => {
    const newOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...authHeaders
      }
    };
    
    return await originalFetch(url, newOptions);
  };
  
  try {
    // Execute the function with enhanced fetch
    return await fn();
  } finally {
    // Restore original fetch
    global.fetch = originalFetch;
  }
}

// Helper function to directly get a fresh client with explicit API key
export const getSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, commonOptions);
}

export { supabase, isUsingServiceRoleKey, checkServiceRoleAccess, getServiceRoleKey }
