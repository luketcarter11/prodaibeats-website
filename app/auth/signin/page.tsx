'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthModal from '../../../src/components/auth/AuthModal'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for error parameter in URL
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(errorParam)
    }

    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // If there's an error parameter, sign out
          if (errorParam === 'profile_load_failed') {
            await supabase.auth.signOut()
            setError('Failed to load profile. Please sign in again.')
          } else {
            router.push('/account')
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router, searchParams])

  const handleClose = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthModal 
      isOpen={true} 
      onClose={handleClose} 
      defaultView="sign-in"
      initialError={error}
    />
  )
} 