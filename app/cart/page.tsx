'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '../../src/context/CartContext'
import { motion } from 'framer-motion'
import { FaMusic, FaTrash } from 'react-icons/fa'

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal, cartCount } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    setIsProcessing(true)
    
    // Simulate a checkout process (this would connect to a payment gateway in a real app)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Clear the cart after successful checkout
    clearCart()
    setIsProcessing(false)
    
    // Navigate to a success page or show a success message
    alert('Your order has been placed successfully!')
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-zinc-900 rounded-xl p-8 mb-8 text-center">
          <div className="flex justify-center mb-6">
            <FaMusic className="w-16 h-16 text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Your Cart is Empty</h1>
          <p className="text-gray-400 mb-8">
            Looks like you haven't added any beats to your cart yet.
          </p>
          <Link
            href="/beats"
            className="bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Browse Beats
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column - Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">
              Your Items ({cartCount})
            </h2>
            
            <div className="space-y-6">
              {cart.map((item) => {
                const coverSrc = item.coverUrl && item.coverUrl.includes('://')
                  ? item.coverUrl
                  : `${CDN}/covers/${item.id}.jpg`;
                return (
                  <div key={item.id} className="flex items-start space-x-4 pb-6 border-b border-white/10">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={coverSrc}
                        alt={item.title ?? 'Untitled Track'}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="text-white font-medium">{item.title ?? 'Untitled Track'}</h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove ${item.title} from cart`}
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <p className="text-gray-400 text-sm">{item.artist}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-purple-400">
                          {item.licenseType} License
                        </span>
                        <div className="text-right">
                          <p className="text-white font-medium">${item.price?.toFixed(2) ?? '0.00'}</p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 rounded-xl p-6 sticky top-10">
            <h2 className="text-xl font-bold text-white mb-6">
              Order Summary
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal ({cartCount} items)</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Processing Fee</span>
                <span>$0.00</span>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between text-white font-bold text-xl">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <Link
              href="/checkout"
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              Proceed to Checkout
            </Link>
            
            <Link
              href="/beats"
              className="w-full mt-4 bg-transparent text-white border border-white/20 py-3 px-6 rounded-lg font-medium hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              Continue Shopping
            </Link>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-white font-medium mb-4">
                Accepted Payment Methods
              </h3>
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-6 text-gray-400" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M44 11v26a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3zm-6 16h-8a2 2 0 0 0 0 4h8a2 2 0 0 0 0-4zm0-8H10a2 2 0 0 0 0 4h28a2 2 0 0 0 0-4z"/>
                </svg>
                <svg className="w-8 h-6 text-gray-400" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M45 11a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v26a4 4 0 0 0 4 4h34a4 4 0 0 0 4-4V11zm-22 2c3 0 6 1.4 7.5 3.6l-3.5 1.7a4.8 4.8 0 0 0-4-1.8 5 5 0 0 0 0 10c1.6 0 3.2-.7 4-1.9l3.5 1.8a10 10 0 1 1-7.5-13.4zm18 5h-6v2h6v3h-4c-1.7 0-3 1.4-3 3v3c0 1.7 1.3 3 3 3h7v-2h-7v-3h4c1.7 0 3-1.3 3-3v-3c0-1.6-1.3-3-3-3z"/>
                </svg>
                <svg className="w-8 h-6 text-gray-400" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M32.7 24A10 10 0 0 1 17 35H7a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4h10a10 10 0 0 1 15.7 11c.8.6 1.5 1.2 2 2 .6.8 1 1.7 1.3 2.7.3 1 .2 2 0 3-.1 1-.5 1.9-1 2.7-.6.8-1.3 1.5-2.1 2a7 7 0 0 1-2.7 1.1c-1 .2-2 .1-3-.2-.9-.2-1.8-.6-2.5-1.2zm-10.5-8.3h6.2c1.5 0 2.6 1 2.6 2.5a2.5 2.5 0 0 1-2.6 2.5h-6.2v-5zm0 8.3h7c1.5 0 2.7 1.1 2.7 2.6 0 1.5-1.2 2.6-2.6 2.6h-7v-5.2z"/>
                </svg>
                <svg className="w-8 h-6 text-gray-400" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M44 11a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v26a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4V11zm-24.5 3A10 10 0 0 1 29 25c0 5.5-4.5 10-10 10-5.5 0-10-4.5-10-10 0-5.5 4.5-10 10-10h.5z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 