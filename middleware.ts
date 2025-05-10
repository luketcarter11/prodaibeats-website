import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware protects routes that require authentication
// It runs on each request and doesn't affect the build process
export async function middleware(req: NextRequest) {
  try {
    // Create a response that we can modify
    const res = NextResponse.next()
    
    // Log the request URL and all cookies for debugging
    console.log('Request URL:', req.nextUrl.pathname)
    console.log('Request cookies:', req.cookies.getAll().map(c => c.name))
    
    // Create a Supabase client configured to use cookies
    // Use explicit cookie handling
    const supabase = createMiddlewareClient({ 
      req, 
      res,
    })

    // Try to get the session
    try {
      // Refresh session if expired
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('Middleware session check:', {
        path: req.nextUrl.pathname,
        hasSession: !!session,
        sessionError: error?.message,
      })
      
      // Check if the request is for the account page
      if (req.nextUrl.pathname.startsWith('/account')) {
        if (!session) {
          console.log('No session found, redirecting to sign in')
          // Redirect to sign in if no session
          const redirectUrl = new URL('/auth/signin', req.url)
          // Add the original URL as a redirect parameter
          redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }
        
        console.log('Session found, allowing access to account page')
      }
    } catch (sessionError) {
      console.error('Error checking session:', sessionError)
      
      // On session error, redirect to sign in for account pages
      if (req.nextUrl.pathname.startsWith('/account')) {
        console.log('Session check failed, redirecting to sign in')
        const redirectUrl = new URL('/auth/signin', req.url)
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue
    return NextResponse.next()
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/account/:path*']
} 