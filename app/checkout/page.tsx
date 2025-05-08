'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { FaArrowLeft, FaSpinner, FaExclamationCircle } from 'react-icons/fa'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import CheckoutForm from '../../components/CheckoutForm'
import type { Appearance } from '@stripe/stripe-js';

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// Load stripe outside of component render to avoid recreating the Stripe object on renders
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Stripe appearance customization
const appearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#9333ea',
    colorBackground: '#18181b',
    colorText: '#ffffff',
    colorDanger: '#ef4444',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
};

type ErrorMessage = {
  message: string;
  type: 'error' | 'warning';
};

export default function CheckoutPage() {
  const { cart, cartTotal, isLoading: cartLoading } = useCart()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState<ErrorMessage | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    // Only redirect if cart is empty after loading is complete
    if (!cartLoading && cart && Array.isArray(cart) && cart.length === 0) {
      router.push('/beats')
      return
    }

    // Create a PaymentIntent as soon as the page loads and cart is ready
    if (!cartLoading && cart.length > 0 && !clientSecret) {
      setPaymentLoading(true);
      setError(null);
      
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart,
          email,
          name
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to create payment intent');
          }
          return data;
        })
        .then((data) => {
          setClientSecret(data.clientSecret);
          setPaymentLoading(false);
        })
        .catch((error) => {
          console.error('Error creating payment intent:', error);
          setError({
            message: error.message || 'Failed to initialize payment. Please try again later.',
            type: 'error'
          });
          setPaymentLoading(false);
        });
    }
  }, [cart, email, name, cartLoading, clientSecret, router]);

  const options = clientSecret ? {
    clientSecret,
    appearance,
  } : { appearance };

  // Show loading state while cart is being initialized
  if (cartLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-4" role="status" aria-label="Loading cart">
          <FaSpinner className="animate-spin h-8 w-8 text-purple-500" aria-hidden="true" />
          <span className="text-white">Loading cart...</span>
        </div>
      </div>
    )
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
          
          <div className="border-t border-white/10 pt-4">
            <dl>
              <div className="flex justify-between text-white mb-2">
                <dt>Subtotal</dt>
                <dd>${cartTotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-gray-400 mb-2">
                <dt>Processing Fee</dt>
                <dd>$0.00</dd>
              </div>
              <div className="flex justify-between text-white font-bold text-xl mt-4 pt-4 border-t border-white/10">
                <dt>Total</dt>
                <dd>${cartTotal.toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </section>
        
        {/* Payment Form */}
        <section 
          className="bg-zinc-900/80 rounded-xl p-6 md:p-8 w-full"
          aria-labelledby="payment-heading"
        >
          <h2 id="payment-heading" className="text-xl font-bold text-white mb-6">Payment Details</h2>
          
          {error && (
            <div 
              className={`mb-6 p-4 rounded-lg flex items-start ${
                error.type === 'error' ? 'bg-red-900/50 border-red-500' : 'bg-yellow-900/50 border-yellow-500'
              } border`}
              role="alert"
            >
              <FaExclamationCircle 
                className={`mt-1 mr-3 ${error.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`}
                aria-hidden="true"
              />
              <p className="text-white flex-1">{error.message}</p>
            </div>
          )}
          
          {paymentLoading ? (
            <div 
              className="flex items-center justify-center p-8" 
              role="status" 
              aria-label="Loading payment options"
            >
              <FaSpinner className="animate-spin h-12 w-12 text-purple-500" aria-hidden="true" />
              <span className="ml-3 text-white">Loading payment options...</span>
            </div>
          ) : clientSecret ? (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm 
                clientSecret={clientSecret}
                email={email}
                setEmail={setEmail}
                name={name}
                setName={setName}
              />
            </Elements>
          ) : (
            <div 
              className="bg-red-900/50 border border-red-500 p-4 rounded-lg"
              role="alert"
            >
              <p className="text-white">Failed to load payment options. Please try again later.</p>
            </div>
          )}
          
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