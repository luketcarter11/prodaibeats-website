'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '../context/CartContext'
import SignInPopup from './SignInPopup'
import SignUpPopup from './SignUpPopup'
import { supabase } from '../../lib/supabase'

// Development notice banner component
const DevNotice = () => {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-yellow-500 text-black py-2 px-4 text-center relative">
      <p className="text-sm font-medium">
        Note: This website is still in development. Any attempt to check out or send payments will not result in a successful order.
      </p>
      <button 
        onClick={handleClose}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-yellow-600 rounded-full transition-colors"
        aria-label="Close development notice"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function Header() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { cartCount } = useCart()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  const handleAuthClick = async () => {
    if (isAuthenticated) {
      router.push('/account')
    } else {
      setIsSignInOpen(true)
    }
  }

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    setIsSignInOpen(false)
    setIsSignUpOpen(false)
  }

  const handleSignUpClick = () => {
    setIsSignInOpen(false)
    setIsSignUpOpen(true)
  }

  const handleSignInClick = () => {
    setIsSignUpOpen(false)
    setIsSignInOpen(true)
  }
  
  const handleLinkClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      <DevNotice />
      <header className="bg-black sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center h-16 sm:h-20 md:h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0" onClick={handleLinkClick}>
              <Image
                src="/images/logo.png"
                alt="PROD AI BEATS"
                width={180}
                height={40}
                className="w-28 sm:w-32 md:w-36 h-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex flex-1 justify-center">
              <div className="flex items-center gap-x-6 xl:gap-x-8">
                <Link href="/" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors">
                  Home
                </Link>
                <Link href="/beats" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors">
                  Beats
                </Link>
                <Link href="/licensing" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors">
                  Licensing
                </Link>
                <Link href="/prod" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-purple-400 transition-colors">
                  $PROD
                </Link>
                <Link href="/about" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors">
                  About
                </Link>
                <Link href="/contact" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors">
                  Contact
                </Link>
              </div>
            </nav>

            {/* Icons and Mobile Menu Button */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="flex items-center space-x-2 md:space-x-4">
                <Link href="/cart" className="text-white p-1.5 hover:text-gray-300 transition-colors duration-200 relative" onClick={handleLinkClick}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button 
                  onClick={handleAuthClick}
                  className="text-white p-1.5 hover:text-gray-300 transition-colors duration-200"
                  aria-label={isAuthenticated ? "View Account" : "Sign In"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-white p-1.5 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-800">
              <nav className="flex flex-col space-y-4">
                <Link href="/" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors px-4" onClick={handleLinkClick}>
                  Home
                </Link>
                <Link href="/beats" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors px-4" onClick={handleLinkClick}>
                  Beats
                </Link>
                <Link href="/licensing" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors px-4" onClick={handleLinkClick}>
                  Licensing
                </Link>
                <Link href="/prod" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-purple-400 transition-colors px-4" onClick={handleLinkClick}>
                  $PROD
                </Link>
                <Link href="/about" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors px-4" onClick={handleLinkClick}>
                  About
                </Link>
                <Link href="/contact" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors px-4" onClick={handleLinkClick}>
                  Contact
                </Link>
                <Link href="/cart" className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors px-4 flex items-center" onClick={handleLinkClick}>
                  Cart {cartCount > 0 && <span className="ml-2 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
                </Link>
                <button 
                  onClick={() => {
                    handleAuthClick();
                    handleLinkClick();
                  }}
                  className="font-heading text-base uppercase tracking-[.2em] text-white hover:text-gray-300 transition-colors px-4 text-left"
                >
                  {isAuthenticated ? 'My Account' : 'Sign In'}
                </button>
              </nav>
            </div>
          )}
        </div>
        <div className="w-full h-[1px] bg-gradient-to-r from-purple-600/60 via-white/10 to-purple-600/60"></div>

        {/* Sign In Popup */}
        <SignInPopup 
          isOpen={isSignInOpen} 
          onClose={() => setIsSignInOpen(false)} 
          onSuccess={handleAuthSuccess}
          onSignUpClick={handleSignUpClick}
        />

        {/* Sign Up Popup */}
        <SignUpPopup 
          isOpen={isSignUpOpen} 
          onClose={() => setIsSignUpOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </header>
    </>
  )
} 