'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Track } from '@/types/track'

// Define CartContextType
interface CartContextType {
  cart: Track[];
  addToCart: (track: Track) => void;
  removeFromCart: (trackId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Track[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)

  // Load cart from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCart = localStorage.getItem('cart')
        if (storedCart) setCart(JSON.parse(storedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage', error)
      }
    }
  }, [])

  // Update localStorage and calculate totals when cart changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cart))
      
      // Update cart count and total
      setCartCount(cart.length)
      setCartTotal(cart.reduce((total, item) => total + (item.price ?? 0), 0))
    }
  }, [cart])

  const addToCart = (track: Track) => {
    setCart((prev) => {
      // Remove the track if it already exists in the cart, then add it
      const filteredCart = prev.filter(t => t.id !== track.id)
      return [...filteredCart, track]
    })
  }

  const removeFromCart = (trackId: string) => {
    setCart((prev) => prev.filter(track => track.id !== trackId))
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
} 