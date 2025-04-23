'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { FaArrowLeft, FaLock } from 'react-icons/fa'

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formCompleted, setFormCompleted] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('United States')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const router = useRouter()
  
  useEffect(() => {
    // If cart is empty, redirect to beats page
    if (cart.length === 0) {
      router.push('/beats')
    }
  }, [cart, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formCompleted) {
      setFormCompleted(true)
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate payment processing
    setTimeout(() => {
      clearCart()
      router.push('/checkout/success')
    }, 1500)
  }

  // Check if all required fields are completed
  useEffect(() => {
    if (
      email.trim() && 
      name.trim() && 
      streetAddress.trim() && 
      city.trim() && 
      state.trim() && 
      zipCode.trim() && 
      country.trim()
    ) {
      setFormCompleted(true)
    } else {
      setFormCompleted(false)
    }
  }, [email, name, streetAddress, city, state, zipCode, country])

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
              {cart.map((item) => (
                <div key={item.id} className="flex items-start space-x-4">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                    <Image
                      src={item.coverUrl}
                      alt={item.title ?? 'Untitled Track'}
                      fill
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
              ))}
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
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Info */}
            <div>
              <h3 className="text-white font-medium mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Billing Address */}
            <div>
              <h3 className="text-white font-medium mb-4">Billing Address</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="streetAddress" className="block text-white text-sm font-medium mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="123 Main St"
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-white text-sm font-medium mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-white text-sm font-medium mb-2">
                      State / Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="zipCode" className="block text-white text-sm font-medium mb-2">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="12345"
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-white text-sm font-medium mb-2">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Payment Method */}
            <div>
              <h3 className="text-white font-medium mb-4">Payment Method</h3>
              <div className="space-y-6">
                <div>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div
                      className={`border ${
                        paymentMethod === 'card'
                          ? 'border-purple-500 bg-purple-600/20'
                          : 'border-zinc-700 bg-zinc-800'
                      } rounded-lg p-4 cursor-pointer flex items-center justify-center`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <div className="text-center">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                        </svg>
                        <span className="text-sm text-white">Credit Card</span>
                      </div>
                    </div>
                    <div
                      className={`border ${
                        paymentMethod === 'paypal'
                          ? 'border-purple-500 bg-purple-600/20'
                          : 'border-zinc-700 bg-zinc-800'
                      } rounded-lg p-4 cursor-pointer flex items-center justify-center`}
                      onClick={() => setPaymentMethod('paypal')}
                    >
                      <div className="text-center">
                        <svg className="w-8 h-8 mx-auto mb-1 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.06 8.94L6.5 5.48c-.11-.7.47-1.35 1.15-1.35h5.8c.55 0 1.02.41 1.11.95l.22 1.39c-.27-.22-.57-.41-.91-.55-.4-.16-.85-.27-1.34-.27h-2.45c-.65 0-1.18.53-1.18 1.18v.05H7.06zM19.5 9.75c0 2.34-2.14 4.24-4.77 4.24h-1.82c-.47 0-.89.39-.89.87l-.7 4.66c-.06.41-.41.73-.83.73h-2.3c-.47 0-.79-.44-.72-.9l1.43-9.14s-.03 0-.04 0L7.55 2.94C7.39 2.39 7.8 1.9 8.37 1.9h6.16c2.72 0 4.97 1.71 4.97 4.23 0 .24-.02.48-.05.71.01.3.05.6.05.91z" />
                        </svg>
                        <span className="text-sm text-white">PayPal</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'card' && (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="cardNumber" className="block text-white text-sm font-medium mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="expiry" className="block text-white text-sm font-medium mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          id="expiry"
                          name="expiry"
                          placeholder="MM/YY"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="cvc" className="block text-white text-sm font-medium mb-2">
                          CVC
                        </label>
                        <input
                          type="text"
                          id="cvc"
                          name="cvc"
                          placeholder="123"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center ${
                isSubmitting ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
              } text-white py-4 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 mt-8 text-lg`}
            >
              <FaLock className="mr-2" />
              {isSubmitting ? 'Processing...' : `Complete Purchase • $${cartTotal.toFixed(2)}`}
            </button>
          </form>
          
          <p className="text-center text-gray-400 text-sm mt-6">
            By completing your purchase, you agree to our{' '}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">
              Terms of Service
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center space-x-6 my-6">
          <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.8,2.4H16.1c3.8,0.1,6.8,3.3,6.8,7.1v5c0,3.9-3.1,7.1-7,7.1H7.8c-3.8,0-7-3.1-7-7V9.5C0.8,5.9,3.7,2.5,7.8,2.4z M5.9,13.1l1.2-3.7h0.7l1.3,3.7H8.1L7.8,12H6.3l-0.4,1.1H5.9z M7.6,11.4L7.1,9.7L6.4,11.4H7.6z M9.7,13.1V9.4h0.8l1.7,2.9h0V9.4h0.8v3.7h-0.8L10.5,10h0v3.1H9.7z M14.6,9.4h0.8v3.7h-0.8V9.4z M12,13.1h-0.8V9.4H12c1.1,0,1.9,0.8,1.9,1.9C13.9,12.3,13.1,13.1,12,13.1z M12,10H12v2.5h0.1c0.6,0,1.1-0.5,1.1-1.2C13.1,10.5,12.6,10,12,10z M14.9,17.2c0.8,0,1.4-0.2,1.8-0.5c0.3-0.2,0.6-0.6,0.8-1l0.7,0.2c-0.2,0.6-0.6,1-0.9,1.3c-0.6,0.5-1.4,0.7-2.3,0.7c-0.9,0-1.8-0.3-2.4-0.9c-0.7-0.6-1-1.5-1-2.6c0-1.1,0.3-1.9,0.9-2.6c0.6-0.6,1.5-0.9,2.4-0.9c0.9,0,1.7,0.2,2.3,0.8c0.5,0.5,0.7,1.1,0.9,1.8l-4.6,1.9C13.7,16.7,14.2,17.1,14.9,17.2z M16.3,13.5c-0.2-0.4-0.7-0.6-1.2-0.6c-0.5,0-1,0.2-1.3,0.7c-0.3,0.4-0.4,0.9-0.4,1.7l3.8-1.6C17,13.8,16.6,13.9,16.3,13.5z"/>
          </svg>
          <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.539 9.186a4.155 4.155 0 0 0-.904-1.177 4.16 4.16 0 0 0-1.177-.903 4.003 4.003 0 0 0-1.494-.344c-.7.007-1.335.177-1.858.507-.524.33-.938.762-1.242 1.292a3.022 3.022 0 0 0-.431 1.233h-.096a3.01 3.01 0 0 0-.431-1.233c-.305-.53-.718-.962-1.242-1.292-.523-.33-1.158-.5-1.857-.507a4.003 4.003 0 0 0-1.494.344 4.16 4.16 0 0 0-1.178.903c-.358.359-.654.747-.885 1.163-.232.415-.35.82-.356 1.214 0 .7.168 1.401.505 2.104.336.703.89 1.468 1.659 2.293.768.826 1.8 1.696 3.092 2.611.265.182.538.368.819.558.281.19.506.338.674.444.169.105.337.21.505.316l.252.163c.1.063.183.09.252.081a.493.493 0 0 0 .253-.081l.252-.163c.168-.106.336-.211.505-.316.168-.106.393-.254.674-.444.281-.19.554-.376.82-.558 1.292-.915 2.324-1.785 3.091-2.61.769-.826 1.322-1.59 1.66-2.294.337-.703.505-1.404.505-2.104a2.617 2.617 0 0 0-.357-1.214 4.135 4.135 0 0 0-.886-1.163z"/>
          </svg>
          <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6,3a3,3,0,0,0-3,3v9c0,4.56,5.27,6.07,5.27,6.07S14,21.5,14,15a2.4,2.4,0,0,0-2.4-2.4A2.4,2.4,0,0,0,9.2,15c0,2.4,2.4,2.4,2.4,2.4H6V6H18v9h0v3h0v0a2,2,0,0,0,4,0V6a3,3,0,0,0-3-3ZM9.2,17.4A2.4,2.4,0,0,1,6.8,15a2.4,2.4,0,1,1,4.8,0A2.4,2.4,0,0,1,9.2,17.4ZM18,6h0Z"/>
          </svg>
        </div>
      </div>
    </div>
  )
} 