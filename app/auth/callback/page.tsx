'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the session from URL
        const { error } = await supabase.auth.getSession()
        
        if (error) throw error

        // Redirect to account page
        router.push('/account')
      } catch (err) {
        console.error('Error confirming email:', err)
        setError(err instanceof Error ? err.message : 'Failed to confirm email')
      }
    }

    handleEmailConfirmation()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full space-y-8 p-8 bg-[#111111] rounded-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Verification Failed
            </h2>
            <p className="mt-2 text-center text-sm text-red-400">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#111111] rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Verifying Email
          </h2>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 