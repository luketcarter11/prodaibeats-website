'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultView?: 'sign-in' | 'sign-up'
  initialError?: string | null
}

interface SignUpFormData {
  email: string
  password: string
  full_name: string
  phone?: string
  country?: string
  billing_address?: string
}

export default function AuthModal({ isOpen, onClose, defaultView = 'sign-in', initialError = null }: AuthModalProps) {
  const [view, setView] = useState<'sign-in' | 'sign-up'>(defaultView)
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    country: '',
    billing_address: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [showResendButton, setShowResendButton] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Update error state when initialError prop changes
    setError(initialError)
  }, [initialError])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleResendEmail = async () => {
    setResendLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setError('Verification email resent. Please check your inbox and spam folder.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowResendButton(false)
    setSignUpSuccess(false)

    try {
      if (view === 'sign-in') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please try again.')
          } else if (error.message.includes('Email not confirmed')) {
            setShowResendButton(true)
            throw new Error('Please verify your email before signing in.')
          } else {
            throw error
          }
        }
        
        router.push('/account')
      } else {
        // Store profile data in localStorage for use after email verification
        const profileData = {
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
          country: formData.country || null,
          billing_address: formData.billing_address || null,
        }
        localStorage.setItem('pendingProfile', JSON.stringify(profileData))

        // Sign up flow - only handle auth registration
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })

        if (signUpError) throw signUpError

        setSignUpSuccess(true)
        setShowResendButton(true)
        setError('Please check your email for the verification link. If you don\'t see it, check your spam folder.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logo.png"
            alt="PRODAI BEATS"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </div>

        {signUpSuccess ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
            <p className="text-gray-300 mb-6">
              We've sent a verification link to <span className="font-semibold">{formData.email}</span>. 
              Please check your inbox and spam folder.
            </p>
            {showResendButton && (
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {view === 'sign-in' ? 'Welcome Back' : 'Create Account'}
            </h2>

            {error && error.includes('Failed to load profile') && (
              <div className="mb-4 p-4 bg-red-900/50 rounded-md">
                <p className="text-red-200 text-sm mb-2">{error}</p>
                <button
                  onClick={handleSignOut}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Sign out and try again
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {view === 'sign-up' && (
                <>
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1">
                      Country (optional)
                    </label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="billing_address" className="block text-sm font-medium text-gray-300 mb-1">
                      Billing Address (optional)
                    </label>
                    <input
                      id="billing_address"
                      name="billing_address"
                      type="text"
                      value={formData.billing_address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              {error && !error.includes('Failed to load profile') && (
                <div className="text-red-500 text-sm mt-2">
                  {error}
                  {showResendButton && view === 'sign-in' && (
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resendLoading}
                      className="ml-2 text-purple-400 hover:text-purple-300"
                    >
                      {resendLoading ? 'Sending...' : 'Resend verification email'}
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : view === 'sign-in' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setView(view === 'sign-in' ? 'sign-up' : 'sign-in')
                  setError(null)
                  setShowResendButton(false)
                  setSignUpSuccess(false)
                  setFormData({
                    email: '',
                    password: '',
                    full_name: '',
                    phone: '',
                    country: '',
                    billing_address: ''
                  })
                }}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                {view === 'sign-in'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 