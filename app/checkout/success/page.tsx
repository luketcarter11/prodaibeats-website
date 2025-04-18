'use client'

import Link from 'next/link'
import { FaCheckCircle, FaDownload, FaMusic } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SuccessPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState('')

  useEffect(() => {
    // Generate a random order number
    const randomOrderNumber = Math.floor(10000000 + Math.random() * 90000000).toString()
    setOrderNumber(randomOrderNumber)
    
    // If the user refreshes the page, redirect them to the home page after 3 seconds
    const timeoutId = setTimeout(() => {
      router.push('/')
    }, 60000) // 1 minute
    
    return () => clearTimeout(timeoutId)
  }, [router])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-zinc-900 rounded-xl p-8 mb-8 text-center">
        <div className="flex justify-center mb-6">
          <FaCheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Order Successful!</h1>
        <p className="text-gray-400 mb-4">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        <div className="inline-block bg-zinc-800 px-4 py-2 rounded-lg mb-8">
          <span className="text-gray-400">Order number:</span>{' '}
          <span className="text-white font-medium">{orderNumber}</span>
        </div>
        
        <p className="text-gray-400 mb-6">
          You will receive a confirmation email shortly with your purchase details and download links.
        </p>
        
        <div className="border-t border-white/10 pt-8 mt-8">
          <h2 className="text-xl font-bold text-white mb-6">Your next steps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-800 p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <FaDownload className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-white font-medium mb-2">Download Files</h3>
              <p className="text-gray-400 text-sm mb-4">
                Access your purchased beats in the downloads section.
              </p>
              <Link
                href="/downloads"
                className="inline-block text-purple-400 hover:text-purple-300 font-medium"
              >
                Go to Downloads
              </Link>
            </div>
            
            <div className="bg-zinc-800 p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-2">Create Music</h3>
              <p className="text-gray-400 text-sm mb-4">
                Start creating amazing tracks with your new beats.
              </p>
              <Link
                href="/tutorials"
                className="inline-block text-purple-400 hover:text-purple-300 font-medium"
              >
                View Tutorials
              </Link>
            </div>
            
            <div className="bg-zinc-800 p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <FaMusic className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-white font-medium mb-2">Explore More</h3>
              <p className="text-gray-400 text-sm mb-4">
                Discover more beats that match your style.
              </p>
              <Link
                href="/beats"
                className="inline-block text-purple-400 hover:text-purple-300 font-medium"
              >
                Browse Beats
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <Link
          href="/"
          className="text-gray-400 hover:text-white"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  )
} 