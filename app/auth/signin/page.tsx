'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/account'

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('Session found, redirecting to:', redirectTo)
        router.push(redirectTo)
      }
    }
    checkSession()
  }, [router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log('Signing in...');
      // Call our server-side API route
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for cookie handling
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Sign in failed:', data.error);
        setError(data.error || 'Failed to sign in')
        setIsLoading(false);
        return
      }

      console.log('Sign in API response success:', data.success);

      // After successful API response, explicitly refresh the session
      console.log('Refreshing session after sign-in...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
        setError('Failed to initialize session. Please try again.');
        setIsLoading(false);
        return;
      }
      
      if (!refreshData.session) {
        console.error('No session after refresh');
        
        // Try directly getting session as fallback
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.error('Get session failed:', sessionError || 'No session found');
          setError('Session not created. Please try again.');
          setIsLoading(false);
          return;
        }
        
        console.log('Got session via getSession instead');
      }

      // Verify we have a session and it's not expired
      const { data: { session }, error: verifyError } = await supabase.auth.getSession();
      
      if (verifyError) {
        console.error('Session verification error:', verifyError);
        setError('Failed to verify session. Please try again.');
        setIsLoading(false);
        return;
      }
      
      if (!session) {
        console.error('No session found after sign in');
        setError('Session not created. Please try again.');
        setIsLoading(false);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = session.expires_at ? session.expires_at - now : null;
      
      console.log('Sign in successful, session created:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at,
        expiresIn: expiresIn ? `${expiresIn} seconds` : 'unknown',
        accessToken: session.access_token ? 'present' : 'missing',
        refreshToken: session.refresh_token ? 'present' : 'missing'
      });

      // Check for and log auth cookies
      const authCookies = document.cookie
        .split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith('sb-'));
        
      console.log('Auth cookies after sign-in:', authCookies.length ? authCookies : 'none found');

      // Redirect to the original destination or account page
      console.log('Redirecting to:', redirectTo);
      router.push(redirectTo)
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#111111] rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-[#1A1A1A] placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-[#1A1A1A] placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}