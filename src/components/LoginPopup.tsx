'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { supabase, withApiKey } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface LoginPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginPopup({ isOpen, onClose }: LoginPopupProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Close popup when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent scrolling when popup is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      // Restore scrolling when popup is closed
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    console.log('Login attempt with:', formData.email)
    
    try {
      // Call our server-side API route instead of Supabase directly
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const result = await response.json();
      console.log('Login response status:', response.status);
      setLoading(false)
      
      if (!response.ok || !result.success) {
        setError(result.message || 'An error occurred during sign in');
        return;
      }
      
      console.log('Login successful, redirecting to account page')
      // Close popup and redirect to account page
      onClose()
      // Use direct navigation for more reliability
      console.log('Navigating directly to account page')
      window.location.href = '/account'
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md"
          >
            <div className="bg-zinc-900/100 border border-white/10 rounded-lg p-8 shadow-xl">
              {error && (
                <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
              )}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
                    autoFocus
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
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-purple-500 hover:text-purple-400"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
                  disabled={loading}
                  onClick={() => console.log('Button clicked')}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Don't have an account?{' '}
                  <Link 
                    href="/auth/signup" 
                    className="text-purple-500 hover:text-purple-400"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 