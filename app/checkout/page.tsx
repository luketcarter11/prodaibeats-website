'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { FaArrowLeft } from 'react-icons/fa'
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

export default function CheckoutPage() {
  const { cart, cartTotal } = useCart()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // If cart is empty, redirect to beats page
    if (cart.length === 0) {
      router.push('/beats')
    }
  }, [cart, router])

  useEffect(() => {
    // Create a PaymentIntent as soon as the page loads
    if (cart.length > 0) {
      setPaymentLoading(true);
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart,
          email,
          name
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
          setPaymentLoading(false);
        })
        .catch((error) => {
          console.error('Error creating payment intent:', error);
          setPaymentLoading(false);
        });
    }
  }, [cart, email, name]);

  const options = clientSecret ? {
    clientSecret,
    appearance,
  } : { appearance };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <Link 
        href="/cart" 
        className="inline-flex items-center text-gray-400 hover:text-white mb-8"
      >
        <FaArrowLeft className="mr-2" />
        Back to Cart
      </Link>
      
      <div className="flex flex-col space-y-8">
        {/* Order Summary */}
        <div className="bg-zinc-900/80 rounded-xl p-6 md:p-8 w-full">
          <h1 className="text-2xl font-bold text-white mb-6">Checkout</h1>
          
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
            <div className="flex justify-between text-white mb-2">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 mb-2">
              <span>Processing Fee</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-white font-bold text-xl mt-4 pt-4 border-t border-white/10">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Payment Form */}
        <div className="bg-zinc-900/80 rounded-xl p-6 md:p-8 w-full">
          <h2 className="text-xl font-bold text-white mb-6">Payment Details</h2>
          
          {paymentLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
            <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg">
              <p className="text-white">Failed to load payment options. Please try again later.</p>
            </div>
          )}
          
          <p className="text-center text-gray-400 text-sm mt-6">
            By completing your purchase, you agree to our{' '}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 