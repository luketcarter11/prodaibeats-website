'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirectUrl') || '/account'

  // Check if we're already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        console.log('User already has an active session, redirecting...')
        router.push(redirectUrl)
      }
    }
    
    checkSession()
  }, [redirectUrl, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDebugInfo(null)
    
    console.log('Sign in attempt for:', formData.email)
    
    try {
      // Call our server-side API route for authentication
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include', // Important for cookie handling
      });
      
      console.log('Login response status:', response.status);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.error('Login failed:', result);
        setError(result.message || 'An error occurred during sign in');
        // Try to get additional debug info
        try {
          const debugResponse = await fetch('/api/auth/debug');
          const debugData = await debugResponse.json();
          setDebugInfo(debugData);
          console.log('Debug data:', debugData);
        } catch (debugErr) {
          console.error('Could not fetch debug info:', debugErr);
        }
        setLoading(false);
        return;
      }
      
      console.log('Login successful, checking session...');
      
      // Verify we have a valid session before redirecting
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        console.log('Session verified, redirecting to:', redirectUrl);
        router.push(redirectUrl);
      } else {
        // If we don't have a session yet, we need to refresh it
        console.log('No session found after login, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Session refresh failed:', refreshError);
          setError('Your login was successful, but session creation failed. Please try again.');
          setLoading(false);
          return;
        }
        
        console.log('Session refreshed, redirecting to:', redirectUrl);
        router.push(redirectUrl);
      }
    } catch (err: any) {
      console.error('Unexpected error during login:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="bg-black min-h-screen">
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 border border-white/10 rounded-lg p-8"
        >
          {error && (
            <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
          )}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm text-purple-500 hover:text-purple-400">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-purple-500 hover:text-purple-400">
                Sign up
              </Link>
            </p>
          </div>
          
          {process.env.NODE_ENV !== 'production' && debugInfo && (
            <div className="mt-8 p-4 bg-gray-900 rounded text-xs text-gray-400 overflow-auto max-h-40">
              <p>Debug Info:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
} 