import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

console.log('✅ Supabase URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('✅ Supabase Anon Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

let supabase: SupabaseClient

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
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

export { supabase }
