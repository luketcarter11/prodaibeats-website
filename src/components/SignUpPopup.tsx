'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { FaSpinner } from 'react-icons/fa'

interface SignUpPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type SignUpStep = 'form' | 'verification' | 'verifying'

export default function SignUpPopup({ isOpen, onClose, onSuccess }: SignUpPopupProps) {
  const [currentStep, setCurrentStep] = useState<SignUpStep>('form')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Sign up with Supabase
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }

      if (!user) {
        throw new Error('No user returned after signup')
      }

      // If we get a user object with no identities, it means the email exists
      if (user && (!user.identities || user.identities.length === 0)) {
        throw new Error('An account with this email already exists. Please try signing in instead.')
      }

      // Move to verification step
      setCurrentStep('verification')

    } catch (err) {
      console.error('Sign up error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationCheck = async () => {
    setCurrentStep('verifying')
    setError(null)

    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError

      if (!session) {
        // Try to sign in with the credentials
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) throw signInError
        if (!user) throw new Error('Verification failed. Please check your email and try again.')
      }

      // Successfully verified
      onSuccess()
      onClose()

    } catch (err) {
      console.error('Verification error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed')
      setCurrentStep('verification')
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'form':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )

      case 'verification':
        return (
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-white font-medium text-lg mb-2">Check Your Email</h3>
              <p className="text-gray-400">
                We've sent a verification link to <span className="text-white">{formData.email}</span>. 
                Please check your email and click the link to verify your account.
              </p>
            </div>
            <button
              onClick={handleVerificationCheck}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              I've Verified My Email
            </button>
          </div>
        )

      case 'verifying':
        return (
          <div className="text-center">
            <FaSpinner className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-4" />
            <p className="text-white">Verifying your account...</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-xl w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {currentStep === 'form' ? 'Create Account' : 'Verify Email'}
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {renderStep()}

          {currentStep === 'form' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    onClose()
                    // You might want to add a callback here to open the sign-in popup
                  }}
                  className="text-purple-400 hover:text-purple-300"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 