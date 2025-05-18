'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { searchParams } = new URL(window.location.href)
      const code = searchParams.get('code')

      if (code) {
        try {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error

          // Get the stored profile data
          const pendingProfileString = localStorage.getItem('pendingProfile')
          if (pendingProfileString && data.session) {
            const pendingProfile = JSON.parse(pendingProfileString)
            
            // Create the profile
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: data.session.user.id,
                  ...pendingProfile
                }
              ])
              .select()

            if (profileError) {
              console.error('Error creating profile:', profileError)
              // Don't throw here - we still want to clean up and redirect
            }

            // Clean up the stored profile data
            localStorage.removeItem('pendingProfile')
          }
          
          // Redirect to account page
          router.push('/account')
        } catch (error) {
          console.error('Error exchanging code for session:', error)
          router.push('/auth/signin?error=verification_failed')
        }
      } else {
        router.push('/')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-white text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Setting up your account...</p>
      </div>
    </div>
  )
} 