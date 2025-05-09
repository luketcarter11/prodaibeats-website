'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // The hash contains the access token and refresh token after email confirmation
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setError('Authentication failed. Please try signing in again.')
          return
        }
        
        console.log('Auth callback successful')
        setMessage('Authentication successful! Redirecting...')
        
        // Redirect to account page
        setTimeout(() => {
          router.push('/account')
        }, 1500)
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        setError('An unexpected error occurred. Please try signing in again.')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="max-w-md w-full p-8 bg-zinc-900 rounded-lg shadow-lg">
        {error ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Failed</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <button 
              onClick={() => router.push('/auth/signin')}
              className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Authentication</h1>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
            </div>
            <p className="text-gray-300">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
} 