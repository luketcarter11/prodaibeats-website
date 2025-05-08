'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '../../src/context/CartContext'
import { motion } from 'framer-motion'
import { FaMusic, FaTrash, FaLock } from 'react-icons/fa'

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
                
                console.log('CART IMAGE DEBUG:', { 
                  id: item.id, 
                  originalUrl: item.coverUrl, 
                  finalUrl: coverSrc 
                });
                
                return (
                  <div key={item.id} className="flex items-start space-x-4 pb-6 border-b border-white/10">
                    <div className="relative w-20 h-20 flex-shrink-0">
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
                        <span className="text-sm text-purple-400 font-semibold">
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
            
            <div className="flex flex-col items-center text-sm text-gray-400 mt-6 pt-6 border-t border-white/10">
              <span>Secured by <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300 transition-colors underline">Stripe</a> · All transactions are encrypted and secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 