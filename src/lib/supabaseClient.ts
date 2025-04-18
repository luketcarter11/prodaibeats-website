// Legacy file maintained for backward compatibility 
// The application has been migrated to use local file storage instead of Supabase

console.warn('DEPRECATION NOTICE: supabaseClient.ts is deprecated and will be removed in a future update.');
console.warn('The application now uses local file storage instead of Supabase.');

// Provide a dummy implementation for backward compatibility
export const supabase = {
  from: () => ({
    select: () => ({
      order: () => ({
        limit: () => ({
          maybeSingle: () => ({
            data: null,
            error: new Error('Supabase is no longer used. The application has been migrated to use local file storage.')
          })
        })
      })
    }),
    insert: () => ({
      data: null,
      error: new Error('Supabase is no longer used. The application has been migrated to use local file storage.')
    }),
    update: () => ({
      data: null,
      error: new Error('Supabase is no longer used. The application has been migrated to use local file storage.')
    }),
    delete: () => ({
      data: null,
      error: new Error('Supabase is no longer used. The application has been migrated to use local file storage.')
    })
  }),
  auth: {
    signOut: async () => ({ error: null }),
    signIn: async () => ({ error: new Error('Authentication via Supabase is no longer supported.') }),
    user: null
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: new Error('File storage via Supabase is no longer supported.') })
    })
  }
};
