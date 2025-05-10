import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Remove the Edge runtime to use Node.js runtime instead
// export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    // Create a Supabase client configured to use cookies
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })
    
    // Attempt to sign in - this will set the cookies automatically
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Check the session directly after login
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData?.session) {
      console.error('Session retrieval error:', sessionError || 'No session created')
      
      // Log cookie information for debugging
      console.log('Cookies after sign in attempt:', 
        cookieStore.getAll().map(c => ({ 
          name: c.name, 
          value: c.value ? 'present' : 'missing'
        }))
      )
      
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Log success information
    console.log('Sign in successful, session created with expiry:', sessionData.session.expires_at)
    console.log('Auth cookies set:', 
      cookieStore.getAll()
        .filter(c => c.name.startsWith('sb-'))
        .map(c => c.name)
    )

    // Return success response - the cookies are already set by the Supabase client
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 