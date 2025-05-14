import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase admin client
 */
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || supabaseUrl === 'https://placeholder-url.supabase.co') {
    throw new Error('Supabase URL is not defined or is a placeholder');
  }
  
  if (!supabaseServiceKey) {
    throw new Error('Supabase service role key is not defined');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}; 