import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware protects routes that require authentication
export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next()
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          res.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Check the URL path
  const { pathname } = req.nextUrl

  // Define protected routes - add any routes that require authentication
  const protectedRoutes = [
    '/account', 
    '/account/',
    '/dashboard',
    '/dashboard/'
  ]

  // If accessing a protected route but not signed in, redirect to login
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !session) {
    // Create URL to redirect to
    const redirectUrl = new URL('/auth/signin', req.url)
    
    // Add the original URL as a query parameter
    redirectUrl.searchParams.set('redirectUrl', pathname)
    
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Only run this middleware on the matching routes
export const config = {
  matcher: [
    '/account/:path*',
    '/dashboard/:path*'
  ]
} 