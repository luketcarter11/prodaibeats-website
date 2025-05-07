'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { Track } from '@/types/track'

interface CartPopupProps {
  isOpen: boolean
  onClose: () => void
  addedTrack: Track | null
}

export default function CartPopup({ isOpen, onClose, addedTrack }: CartPopupProps) {
  const { cart, cartTotal } = useCart()
  const [isVisible, setIsVisible] = useState(false)

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Use environment variable for CDN base URL
  const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev'

  if (!isOpen && !isVisible) return null

  return (
    <div 
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-xl transform transition-transform duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Added to Cart</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {addedTrack && (
          <div className="p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="relative w-20 h-20 flex-shrink-0">
                {(() => {
                  const coverSrc = addedTrack.coverUrl && addedTrack.coverUrl.includes('://')
                    ? addedTrack.coverUrl
                    : `${CDN}/covers/${addedTrack.id}.jpg`;
                  return (
                    <Image
                      src={coverSrc}
                      alt={addedTrack.title ?? 'Untitled Track'}
                      fill
                      className="object-cover rounded"
                    />
                  );
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{addedTrack.title}</h3>
                <p className="text-gray-400 text-sm">{addedTrack.artist}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">
                    {addedTrack.licenseType || 'License'} License
                  </span>
                  <p className="text-white font-medium">${(addedTrack.price ?? 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center mb-6">
                <div className="text-gray-400">
                  Cart Total ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                </div>
                <div className="text-white font-bold text-xl">
                  ${cartTotal.toFixed(2)}
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <Link
                  href="/checkout"
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/cart"
                  className="w-full bg-transparent text-white border border-white/20 py-3 rounded-lg font-medium hover:bg-white/5 transition-colors text-center"
                >
                  View Cart
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 