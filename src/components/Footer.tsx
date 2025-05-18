'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const user = null // Assuming no user is logged in by default

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement mailing list signup
    console.log('Signing up:', email)
  }

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (user) {
      window.location.href = '/account'
    } else {
      window.location.href = '/sign-in'
    }
  }

  return (
    <footer>
      <div className="w-full h-[1px] bg-gradient-to-r from-purple-600/60 via-white/10 to-purple-600/60 my-12"></div>
      {/* Mailing List Section */}
      <div className="max-w-6xl mx-auto px-8 text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">JOIN OUR MAILING LIST</h2>
        <p className="text-gray-400 mb-8">Get the latest updates, beats, and special offers.</p>
        
        <form onSubmit={handleSubmit} className="flex max-w-2xl mx-auto gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 bg-[#1f1f1f] text-white px-4 py-3"
            required
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-8 py-3 hover:bg-purple-700 transition-colors flex items-center"
          >
            Sign Up →
          </button>
        </form>
      </div>

      {/* Links Section */}
      <div>
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Links Column */}
          <div>
            <h3 className="font-bold mb-4">LINKS</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={handleAccountClick}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {user ? 'My Account' : 'Sign In'}
                </button>
              </li>
              <li><Link href="/beats" className="text-gray-400 hover:text-white">Beats</Link></li>
              <li><Link href="/licensing" className="text-gray-400 hover:text-white">Licensing</Link></li>
              <li><span className="text-gray-400">Beat Packs <span className="text-gray-400">(Coming Soon)</span></span></li>
            </ul>
          </div>

          {/* Genres Column */}
          <div>
            <h3 className="font-bold mb-4">GENRES</h3>
            <ul className="space-y-2">
              <li><Link href="/beats" className="text-gray-400 hover:text-white">All Genres</Link></li>
              <li><Link href="/beats?genres=Hip%20Hop" className="text-gray-400 hover:text-white">Hip Hop Beats</Link></li>
              <li><Link href="/beats?genres=R%26B" className="text-gray-400 hover:text-white">R&B Beats</Link></li>
              <li><Link href="/beats?genres=Pop" className="text-gray-400 hover:text-white">Pop Beats</Link></li>
              <li><Link href="/beats?genres=Electronic" className="text-gray-400 hover:text-white">Electronic Beats</Link></li>
            </ul>
          </div>

          {/* Beats Column */}
          <div>
            <h3 className="font-bold mb-4">BEATS</h3>
            <ul className="space-y-2">
              <li><Link href="/beats?mood=Chill" className="text-gray-400 hover:text-white">Chill Beats</Link></li>
              <li><Link href="/beats?mood=Upbeat" className="text-gray-400 hover:text-white">Upbeat Beats</Link></li>
              <li><Link href="/beats?mood=Sad" className="text-gray-400 hover:text-white">Sad Beats</Link></li>
              <li><Link href="/beats?mood=Dark" className="text-gray-400 hover:text-white">Dark Beats</Link></li>
              <li><Link href="/beats?mood=Happy" className="text-gray-400 hover:text-white">Happy Beats</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-bold mb-4">COMPANY</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              <li><Link href="/legal/terms-of-service" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              <li><Link href="/legal/privacy-policy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/legal/cookies" className="text-gray-400 hover:text-white">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Social Column */}
          <div>
            <h3 className="font-bold mb-4">FOLLOW US</h3>
            <ul className="space-y-2">
              <li><a href="https://x.com/prodaibeats" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Twitter</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full h-[1px] bg-gradient-to-r from-purple-600/60 via-white/10 to-purple-600/60"></div>
      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 text-center text-sm text-gray-500">
          <div className="mb-2">© 2024 PRODAI BEATS. All rights reserved.</div>
          <div className="flex items-center justify-center gap-2">
            <Link href="/legal/cookies" className="text-gray-500 hover:text-gray-400">Cookie Policy</Link>
            <span className="text-gray-700">|</span>
            <Link href="/legal/privacy-policy" className="text-gray-500 hover:text-gray-400">Privacy Policy</Link>
            <span className="text-gray-700">|</span>
            <Link href="/legal/terms-of-service" className="text-gray-500 hover:text-gray-400">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 