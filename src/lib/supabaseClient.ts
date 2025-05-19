// Note: Only Supabase Storage has been deprecated in favor of local file storage
// Database operations (transactions, orders, etc.) still use Supabase

console.warn('Note: Supabase Storage features have been moved to local file storage');
console.warn('Database operations continue to use Supabase');

import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance of the browser client
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>>

function getSupabaseBrowserClient() {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return ''
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 31536000}`
        },
        remove(name: string, options: { path?: string }) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        },
      },
    }
  )

  return supabaseInstance
}

export const supabase = getSupabaseBrowserClient()

// Create a single instance of the admin client
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_KEY || supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// The old implementation below is only for file storage compatibility
// and will be removed once all file storage operations are migrated
interface SupabaseError {
  message: string;
  code?: string;
}

// Provide a dummy implementation for backward compatibility with old storage operations
export const supabaseOld = {
  from: (table: string) => ({
    select: (fields?: string) => ({
      order: (column: string, options?: any) => ({
        limit: (n: number) => ({
          maybeSingle: () => ({
            data: table === 'scheduler_state' ? { json_state: { active: false, nextRun: null, sources: [], logs: [] } } : null,
            error: null as SupabaseError | null
          })
        })
      })
    }),
    insert: (data: any) => ({
      data: null,
      error: null as SupabaseError | null
    }),
    update: (data: any) => ({
      data: null,
      error: null as SupabaseError | null
    }),
    delete: () => ({
      data: null,
      error: null as SupabaseError | null
    })
  }),
  auth: {
    signOut: async () => ({ error: null as SupabaseError | null }),
    signIn: async () => ({ 
      error: { 
        message: 'Authentication via Supabase is no longer supported.' 
      } as SupabaseError 
    }),
    user: null
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => ({ error: null as SupabaseError | null })
    })
  }
};
