'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { FaArrowLeft, FaSpinner, FaExclamationCircle } from 'react-icons/fa'
import { supabase } from '@/lib/supabaseClient'
import { discountService, DiscountCode } from '@/services/discountService'
import { getStripe } from '../../lib/stripe'
import SignInPopup from '@/components/SignInPopup'
import SignUpPopup from '@/components/SignUpPopup'

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

interface AppliedDiscount {
  code: string
  amount: number
  type: 'percentage' | 'fixed'
}

interface ErrorMessage {
  message: string;
  field?: string;
}

export default function CheckoutPage() {
  const { cart, cartTotal, isLoading } = useCart()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [error, setError] = useState<ErrorMessage | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountedTotal, setDiscountedTotal] = useState(cartTotal)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const router = useRouter()

  // Check authentication status and get user email on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsAuthenticated(true)
        setUserEmail(user.email || '')
      }
    }
    checkAuth()
  }, [])

  // Calculate discounted total whenever appliedDiscount changes
  // (only when not already set by the API response)
  useEffect(() => {
    // Skip recalculation if already handled directly in the discount application code
    if (appliedDiscount && discountedTotal !== cartTotal) {
      // We've already set the discounted total from the API
      return;
    }
    
    if (appliedDiscount) {
      const newTotal = appliedDiscount.type === 'percentage'
        ? cartTotal * (1 - appliedDiscount.amount / 100)
        : cartTotal - appliedDiscount.amount;
      setDiscountedTotal(Math.max(0.50, newTotal));
    } else {
      setDiscountedTotal(cartTotal);
    }
  }, [appliedDiscount, cartTotal, discountedTotal]);

  const handleAuthSuccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setIsAuthenticated(true)
      setUserEmail(user.email || '')
    }
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim() || isApplyingDiscount) return;

    setIsApplyingDiscount(true);
    setDiscountError(null);
    setError(null);

    try {
      console.log('Applying discount code:', discountCode);
      const response = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, total: cartTotal })
      });

      const data = await response.json();
      console.log('Discount validation response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply discount code');
      }

      if (data.isValid) {
        // Use the finalAmount directly from the API if available
        if (data.finalAmount !== undefined && data.finalAmount < 0.50) {
          setDiscountError('The total amount after discount must be at least $0.50');
          setAppliedDiscount(null);
          setDiscountedTotal(cartTotal);
        } else {
          // Apply the discount
          setAppliedDiscount({
            code: data.code.code,
            amount: data.code.amount,
            type: data.code.type
          });
          
          // Set the discounted total directly from API if available
          if (data.finalAmount !== undefined) {
            setDiscountedTotal(data.finalAmount);
          }
          
          // Display confirmation message
          console.log(`Discount of ${data.discountAmount?.toFixed(2) || 'unknown'} applied. New total: ${data.finalAmount?.toFixed(2) || 'calculated locally'}`);
        }
      } else {
        setDiscountError(data.error || 'Invalid discount code');
        setAppliedDiscount(null);
      }
    } catch (error: any) {
      console.error('Error applying discount:', error);
      setDiscountError(error.message || 'Failed to apply discount code');
      setAppliedDiscount(null);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleCheckout = async () => {
    if (isRedirecting) return;
    if (!isAuthenticated) {
      setError({
        message: 'Please sign in or create an account to complete your purchase.',
        field: 'auth'
      });
      return;
    }
    
    setIsRedirecting(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          email: userEmail,
          discountCode: appliedDiscount?.code
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // If we have a direct URL, use it
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
        return;
      }

      // Otherwise, use Stripe's redirect
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError({ 
        message: error.message || 'Failed to process checkout',
        field: 'checkout'
      });
      setIsRedirecting(false);
    }
  };

  // Show loading state while cart is being initialized
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-4" role="status" aria-label="Loading cart">
          <FaSpinner className="animate-spin h-8 w-8 text-purple-500" aria-hidden="true" />
          <span className="text-white">Loading cart...</span>
        </div>
      </div>
    );
  }

  // Redirect to beats page if cart is empty
  if (!isLoading && (!cart || cart.length === 0)) {
    router.push('/beats');
    return null;
  }

  // Update the display of discount amount in the UI
  const displayDiscountAmount = appliedDiscount
    ? appliedDiscount.type === 'percentage'
      ? (cartTotal * appliedDiscount.amount) / 100
      : appliedDiscount.amount
    : 0;

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
            
            {discountError && (
              <div className="mt-2 text-red-400 text-sm">
                {discountError}
              </div>
            )}
            
            {appliedDiscount && (
              <div className="mt-2 flex items-center">
                <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                  Discount applied: {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}%` : `$${appliedDiscount.amount}`} off
                </span>
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
                  <dt>Discount ({appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}%` : `$${appliedDiscount.amount}`})</dt>
                  <dd>-${(cartTotal - discountedTotal).toFixed(2)}</dd>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-xl mt-4 pt-4 border-t border-white/10">
                <dt>Total</dt>
                <dd>${discountedTotal.toFixed(2)}</dd>
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
            {!isAuthenticated ? (
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-2">Sign In Required</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Please sign in or create an account to complete your purchase. This helps you track your orders and access your beats.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsSignInOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsSignUpOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm font-medium"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-sm">
                  Signed in as <span className="text-white font-medium">{userEmail}</span>
                </p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isRedirecting || !isAuthenticated || cart.length === 0}
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
              href="/terms-of-use" 
              className="text-purple-400 hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            >
              Terms of Service
            </Link>
          </p>
        </section>
      </div>

      {error && error.field === 'checkout' && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
          <p className="text-white text-sm">{error.message}</p>
        </div>
      )}

      {/* Sign In/Up Popups */}
      <SignInPopup 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)}
        onSuccess={handleAuthSuccess}
      />
      <SignUpPopup
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
} 