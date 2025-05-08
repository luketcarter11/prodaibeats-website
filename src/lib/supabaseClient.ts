// Legacy file maintained for backward compatibility 
// The application has been migrated to use local file storage instead of Supabase

console.warn('DEPRECATION NOTICE: supabaseClient.ts is deprecated and will be removed in a future update.');
console.warn('The application now uses local file storage instead of Supabase.');

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

interface SupabaseError {
  message: string;
  code?: string;
}

// Provide a dummy implementation for backward compatibility
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
