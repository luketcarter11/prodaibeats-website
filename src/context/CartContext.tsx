'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Track } from '@/types/track'

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev'

// Define CartContextType
interface CartContextType {
  cart: Track[];
  addToCart: (track: Track, licenseType?: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  cartCount: number;
  cartTotal: number;
}

export const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  updateTrack: () => {},
  cartCount: 0,
  cartTotal: 0,
})

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Track[]>([])
  
  // Load cart from localStorage on client-side
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        
        // Verify and fix any broken coverUrl
        const fixedCart = parsedCart.map((item: Track) => {
          // Ensure coverUrl is an absolute URL
          if (!item.coverUrl || !item.coverUrl.includes('://')) {
            return {
              ...item,
              coverUrl: `${CDN}/covers/${item.id}.jpg`
            }
          }
          return item
        })
        
        setCart(fixedCart)
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error)
      }
    }
  }, [])
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length) {
      localStorage.setItem('cart', JSON.stringify(cart))
    } else {
      localStorage.removeItem('cart')
    }
  }, [cart])
  
  const addToCart = (track: Track, licenseType?: string) => {
    // Ensure coverUrl is an absolute URL
    const coverUrl = track.coverUrl && track.coverUrl.includes('://')
      ? track.coverUrl
      : `${CDN}/covers/${track.id}.jpg`
      
    setCart(prev => {
      // Check if track is already in cart
      const exists = prev.some(item => item.id === track.id)
      if (exists) {
        return prev
      }
      
      // Add track to cart with correct coverUrl
      return [...prev, { 
        ...track, 
        licenseType: (licenseType || track.licenseType || 'Non-Exclusive') as 'Non-Exclusive' | 'Non-Exclusive Plus' | 'Exclusive' | 'Exclusive Plus' | 'Exclusive Pro',
        coverUrl  // Use the fixed coverUrl
      }]
    })
  }
  
  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }
  
  const clearCart = () => {
    setCart([])
  }
  
  const updateTrack = (id: string, updates: Partial<Track>) => {
    setCart(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    )
  }
  
  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => {
    return total + (item.price || 0)
  }, 0)
  
  // Cart count
  const cartCount = cart.length
  
  // Context value
  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    updateTrack,
    cartTotal,
    cartCount,
  }
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
} 