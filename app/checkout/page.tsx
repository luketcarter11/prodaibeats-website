'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { FaArrowLeft, FaSpinner, FaExclamationCircle } from 'react-icons/fa'
import { supabase } from '@/lib/supabaseClient'

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

type ErrorMessage = {
  message: string;
  field?: string;
};

export default function CheckoutPage() {
  const { cart, cartTotal, isLoading } = useCart()
  const [email, setEmail] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    type: 'percentage' | 'fixed';
  } | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [error, setError] = useState<ErrorMessage | null>(null)
  const router = useRouter()
  
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return

    setIsApplyingDiscount(true)
    setError(null)

    try {
      const { data: codes, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.trim())
        .eq('isActive', true)
        .single()

      if (error) throw error

      if (!codes) {
        setError({ message: 'Invalid discount code', field: 'discountCode' })
        return
      }

      const code = codes
      const now = new Date()
      const expirationDate = new Date(code.expiration)

      if (expirationDate < now) {
        setError({ message: 'This discount code has expired', field: 'discountCode' })
        return
      }

      if (code.maxUses && code.currentUses >= code.maxUses) {
        setError({ message: 'This discount code has reached its usage limit', field: 'discountCode' })
        return
      }

      setAppliedDiscount({
        code: code.code,
        amount: code.amount,
        type: code.type
      })
      setError(null)
    } catch (err: any) {
      setError({ message: err.message, field: 'discountCode' })
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  const calculateDiscountedTotal = () => {
    if (!appliedDiscount) return cartTotal

    if (appliedDiscount.type === 'percentage') {
      const discount = (cartTotal * appliedDiscount.amount) / 100
      return cartTotal - discount
    } else {
      return Math.max(0, cartTotal - appliedDiscount.amount)
    }
  }

  const handleCheckout = async () => {
    try {
      setIsRedirecting(true)
      setError(null)

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          email,
          discountCode: appliedDiscount?.code
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError({ message: err.message })
      setIsRedirecting(false)
    }
  }

  // Show loading state while cart is being initialized
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-4" role="status" aria-label="Loading cart">
          <FaSpinner className="animate-spin h-8 w-8 text-purple-500" aria-hidden="true" />
          <span className="text-white">Loading cart...</span>
        </div>
      </div>
    )
  }

  // Redirect to beats page if cart is empty
  if (!isLoading && (!cart || cart.length === 0)) {
    router.push('/beats');
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <nav aria-label="Breadcrumb">
        <Link 
          href="/cart" 
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg px-2 py-1"
        >
          <FaArrowLeft className="mr-2" aria-hidden="true" />
          Back to Cart
        </Link>
      </nav>
      
      <div className="flex flex-col space-y-8">
        {/* Order Summary */}
        <section 
          className="bg-zinc-900/80 rounded-xl p-6 md:p-8 w-full"
          aria-labelledby="order-heading"
        >
          <h1 id="order-heading" className="text-2xl font-bold text-white mb-6">Checkout</h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
            <div className="space-y-4">
              {cart.map((item) => {
                const coverSrc = item.coverUrl && item.coverUrl.includes('://')
                  ? item.coverUrl
                  : `${CDN}/covers/${item.id}.jpg`;
                
                return (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                      <Image
                        src={coverSrc}
                        alt={item.title ?? 'Untitled Track'}
                        fill
                        unoptimized={true}
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="text-white font-medium">{item.title ?? 'Untitled Track'}</h3>
                        <p className="text-white font-medium">${item.price?.toFixed(2) ?? '0.00'}</p>
                      </div>
                      <p className="text-gray-400 text-sm">{item.artist}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-400">
                          {item.licenseType} License
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Discount Code Section */}
          <div className="mt-6 mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Enter discount code"
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleApplyDiscount}
                disabled={isApplyingDiscount || !discountCode.trim()}
                className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center"
              >
                {isApplyingDiscount ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Applying...
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            {appliedDiscount && (
              <div className="mt-2 text-green-400">
                Discount applied: {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}%` : `$${appliedDiscount.amount}`} off
              </div>
            )}
          </div>
          
          <div className="border-t border-white/10 pt-4">
            <dl>
              <div className="flex justify-between text-white mb-2">
                <dt>Subtotal</dt>
                <dd>${cartTotal.toFixed(2)}</dd>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-green-400 mb-2">
                  <dt>Discount</dt>
                  <dd>
                    -{appliedDiscount.type === 'percentage'
                      ? `$${((cartTotal * appliedDiscount.amount) / 100).toFixed(2)}`
                      : `$${appliedDiscount.amount.toFixed(2)}`}
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-xl mt-4 pt-4 border-t border-white/10">
                <dt>Total</dt>
                <dd>${calculateDiscountedTotal().toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </section>
        
        {/* Payment Section */}
        <section 
          className="bg-zinc-900/80 rounded-xl p-6 md:p-8 w-full"
          aria-labelledby="payment-heading"
        >
          <h2 id="payment-heading" className="text-xl font-bold text-white mb-6">Payment Details</h2>
          
          {error && (
            <div 
              className={`mb-6 p-4 rounded-lg flex items-start ${
                error.field === 'discountCode' ? 'bg-red-900/50 border-red-500' : 'bg-yellow-900/50 border-yellow-500'
              } border`}
              role="alert"
            >
              <FaExclamationCircle 
                className={`mt-1 mr-3 ${error.field === 'discountCode' ? 'text-red-500' : 'text-yellow-500'}`}
                aria-hidden="true"
              />
              <p className="text-white flex-1">{error.message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              onClick={handleCheckout}
              disabled={isRedirecting || !email || cart.length === 0}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isRedirecting ? (
                <>
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Redirecting to Checkout...
                </>
              ) : (
                'Complete Purchase'
              )}
            </button>
          </div>
          
          <p className="text-center text-gray-400 text-sm mt-6">
            By completing your purchase, you agree to our{' '}
            <Link 
              href="/terms" 
              className="text-purple-400 hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            >
              Terms of Service
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
} 