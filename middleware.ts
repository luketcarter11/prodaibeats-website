import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a response early
    const res = NextResponse.next()
    
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req: request, res })

    // Check if we're accessing the crypto-payment page
    if (request.nextUrl.pathname === '/crypto-payment') {
      // Get transaction ID from URL first
      const searchParams = request.nextUrl.searchParams
      const transactionId = searchParams.get('transaction')

      // If no transaction ID or invalid format, redirect to checkout
      if (!transactionId || transactionId === 'undefined') {
        console.error('Invalid or missing transaction ID in URL')
        return NextResponse.redirect(new URL('/checkout', request.url))
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(transactionId)) {
        console.error('Invalid transaction ID format')
        return NextResponse.redirect(new URL('/checkout', request.url))
      }

      // Get session but don't enforce it yet - let the page handle auth
      const { data: { session } } = await supabase.auth.getSession()
      
      // Attach session to response for the page to use
      return res
    }

    // For all other routes, just continue
    return res
  } catch (e) {
    console.error('Middleware error:', e)
    return NextResponse.next()
  }
}

// Specify which routes should trigger this middleware
export const config = {
  matcher: [
    '/crypto-payment',
    '/api/crypto-price'
  ]
} 