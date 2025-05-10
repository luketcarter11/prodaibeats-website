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
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
    // Use cookies as primary session storage mechanism
    flowType: 'pkce' as const,
    // Set session refresh logic
    onAuthStateChange: (event: string, session: any) => {
      console.log(`Auth state changed: ${event}`, {
        hasSession: !!session,
        expiresAt: session?.expires_at,
      });
    },
    // Adjust session timeout
    autoRefreshTimeBeforeExpiry: 60, // Refresh 60 seconds before token expires
    // Custom storage implementation to save cookies properly
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null;
        try {
          // Check for cookie first
          const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${key}=`))
            ?.split('=')[1];
            
          if (cookieValue) {
            console.log(`Found cookie for key ${key}`);
            try {
              return JSON.parse(decodeURIComponent(cookieValue));
            } catch (parseError) {
              console.log(`Cookie value for ${key} is not JSON, returning raw value`);
              return cookieValue;
            }
          }
          
          // Fall back to localStorage
          const value = window.localStorage.getItem(key);
          if (!value) return null;
          
          console.log(`Found localStorage value for key ${key}`);
          // Try to parse the value as JSON
          return JSON.parse(value);
        } catch (error) {
          console.error('Error retrieving stored value:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try {
          // Ensure value is stringified before storage
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          window.localStorage.setItem(key, stringValue);
          console.log(`Stored value in localStorage for key ${key}`);
        } catch (error) {
          console.error('Error storing value:', error);
        }
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.removeItem(key);
          // Also remove any cookie with this name
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          console.log(`Removed value for key ${key} from storage`);
        } catch (error) {
          console.error('Error removing value:', error);
        }
      }
    }
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
    // IMPORTANT: Always use anon key for client-side operations
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      ...commonOptions,
      global: {
        ...commonOptions.global,
        headers: {
          ...commonOptions.global.headers,
          'x-client-info': 'supabase-js/2.38.0'
        }
      },
      auth: {
        ...commonOptions.auth,
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        // Remove the unsupported property
        // autoRefreshTimeBeforeExpiry: 300 // 5 minutes before expiry
      }
    });
    
    console.log('✅ Supabase client initialized for browser using anon key');
    
    // Add auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', {
        event,
        hasSession: !!session,
        sessionExpiry: session?.expires_at,
        accessToken: session?.access_token ? 'present' : 'missing',
        refreshToken: session?.refresh_token ? 'present' : 'missing'
      });
      
      // Force refresh on important auth events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Refresh the current page to ensure cookies are properly loaded
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
    
    // On load, manually check for auth cookies and try to restore session
    const authCookieExists = document.cookie.split(';').some(c => c.trim().startsWith('sb-'));
    
    if (authCookieExists) {
      console.log('Auth cookie found on load, checking sessions');
      
      // First try retrieving session
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error('Error retrieving session on load:', error);
          
          // Try parsing the cookie manually to construct a session
          try {
            const cookies = document.cookie.split(';').map(c => c.trim());
            const authCookie = cookies.find(c => c.startsWith('sb-'));
            
            if (authCookie) {
              console.log('Found auth cookie, attempting recovery');
              
              // Clear the problematic cookie
              document.cookie = `${authCookie.split('=')[0]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
              
              // Let user know they need to sign in again
              console.warn('Session recovery failed - auth cookie cleared, please sign in again');
            }
          } catch (cookieError) {
            console.error('Cookie parsing error:', cookieError);
          }
        } else if (data?.session) {
          console.log('Session found on load:', {
            userId: data.session.user.id,
            expiresAt: data.session.expires_at
          });
        } else {
          console.warn('No session found despite auth cookie presence - cookie may be invalid');
        }
      });
    }
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
    throw error; // Re-throw to make the error visible
  }
}
// Server-side initialization
else {
  if (supabaseUrl && supabaseAnonKey) {
    // Always use anon key for server-side auth operations
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      ...commonOptions,
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔑 Using Supabase anon key for server-side operations')
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
    
    // Add logging in development to debug auth issues
    if (process.env.NODE_ENV !== 'production' && url.toString().includes('auth')) {
      console.log(`Enhanced auth request to ${url.toString().split('?')[0]}`);
      console.log('API key included:', !!apiKey);
    }
    
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
  // Always use anon key for client facing operations
  return createClient(supabaseUrl, supabaseAnonKey, commonOptions);
}

// Create a function specifically for auth signups that ensures the anon key is used
export const signUpWithSupabase = async (email: string, password: string, options?: any) => {
  // Always use anon key for authentication
  const authClient = createClient(supabaseUrl, supabaseAnonKey, commonOptions);
  
  return await withApiKey(async () => {
    return await authClient.auth.signUp({
      email,
      password,
      options
    });
  });
};

// Create a helper function to ensure the profiles table exists
export const ensureProfilesTable = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    // First check if the profiles table exists
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error && error.code === 'PGRST109') {
      console.warn('Profiles table does not exist, attempting to create it');
      
      // Define the SQL to create the profiles table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT,
          full_name TEXT,
          display_name TEXT,
          avatar_url TEXT,
          billing_address TEXT,
          country TEXT,
          phone TEXT,
          profile_picture_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Set up Row Level Security
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own profile" 
          ON public.profiles FOR SELECT 
          USING (auth.uid() = id);
          
        CREATE POLICY "Users can update their own profile" 
          ON public.profiles FOR UPDATE 
          USING (auth.uid() = id);
          
        CREATE POLICY "Users can insert their own profile" 
          ON public.profiles FOR INSERT 
          WITH CHECK (auth.uid() = id);
      `;
      
      // Execute the SQL using the service role if available
      if (getServiceRoleKey()) {
        // Create admin client with service role
        const adminClient = createClient(
          supabaseUrl, 
          getServiceRoleKey() || '', 
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );
        
        const { error: sqlError } = await adminClient.rpc('exec_sql', { sql: createTableSQL });
        
        if (sqlError) {
          console.error('Error creating profiles table with service role:', sqlError);
          return { success: false, error: sqlError };
        }
        
        console.log('Profiles table created successfully with service role');
        return { success: true };
      } else {
        // No service role available, try to use a stored procedure if it exists
        const { error: rpcError } = await supabase.rpc('create_profiles_table');
        
        if (rpcError) {
          console.error('Error creating profiles table via RPC:', rpcError);
          return { success: false, error: rpcError };
        }
        
        console.log('Profiles table created successfully via RPC');
        return { success: true };
      }
    } else if (error) {
      console.error('Error checking if profiles table exists:', error);
      return { success: false, error };
    }
    
    // Table already exists
    console.log('Profiles table already exists');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error ensuring profiles table:', err);
    return { success: false, error: err };
  }
};

export { supabase, isUsingServiceRoleKey, checkServiceRoleAccess, getServiceRoleKey }
