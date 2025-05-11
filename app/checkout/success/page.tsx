'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { FaCheckCircle, FaSpinner } from 'react-icons/fa'

// Separate component that uses useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCleared, setHasCleared] = useState(false)
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      setError('Invalid checkout session')
      setIsLoading(false)
      return
    }

    if (!hasCleared) {
      clearCart()
      setHasCleared(true)
    }
    
    setIsLoading(false)
  }, [searchParams, clearCart, hasCleared])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <FaSpinner className="animate-spin h-8 w-8 text-purple-500" />
          <span className="text-white">Verifying payment...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link
            href="/cart"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <FaCheckCircle className="mx-auto h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Thank You for Your Purchase!</h1>
        <p className="text-gray-400 mb-8">
          Your payment has been processed successfully. You will receive an email with your download links and license information shortly.
        </p>
        <div className="space-y-4">
          <Link
            href="/account/downloads"
            className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            View Downloads
          </Link>
          <Link
            href="/beats"
            className="block w-full bg-zinc-800 text-white px-6 py-3 rounded-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function SuccessPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <FaSpinner className="animate-spin h-8 w-8 text-purple-500" />
            <span className="text-white">Loading...</span>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
} 