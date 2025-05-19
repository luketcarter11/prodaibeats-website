'use client'

import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'

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
            <ul className="space-y-4">
              <li>
                <a 
                  href="https://x.com/prodaibeats" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white flex items-center gap-2"
                  aria-label="Follow us on X (Twitter)"
                >
                  <svg 
                    className="w-5 h-5" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>X (Twitter)</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://open.spotify.com/artist/6rtcV1PtuVS90XXBUrATdl" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white flex items-center gap-2"
                  aria-label="Listen to our music on Spotify"
                >
                  <img 
                    src="/platforms/spotify.svg" 
                    alt="Spotify logo" 
                    className="w-5 h-5"
                  />
                  <span>Spotify</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://music.apple.com/gb/artist/prod-ai/1805435269" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white flex items-center gap-2"
                  aria-label="Listen to our music on Apple Music"
                >
                  <img 
                    src="/platforms/apple-music.svg" 
                    alt="Apple Music logo" 
                    className="w-5 h-5"
                  />
                  <span>Apple Music</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://music.amazon.co.uk/artists/B0F3199RHN/prod-ai" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white flex items-center gap-2"
                  aria-label="Listen to our music on Amazon Music"
                >
                  <img 
                    src="/platforms/amazon-music.svg" 
                    alt="Amazon Music logo" 
                    className="w-5 h-5 brightness-0 invert"
                  />
                  <span>Amazon Music</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Crypto Section */}
      <div className="max-w-6xl mx-auto px-6 py-10 text-center">
        <div className="bg-black/50 p-6 rounded-xl border border-purple-800/30 backdrop-blur-sm max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/images/$PRODcrypto.png" 
              alt="$PROD token" 
              className="w-10 h-10 mr-3"
            />
            <h3 className="text-xl font-bold">$PROD <span className="text-purple-400">TOKEN</span></h3>
          </div>
          <p className="text-gray-400 mb-4 text-sm">
            Our native token powering AI-driven music production & licensing
          </p>
          <div className="bg-black/70 p-2 rounded-lg border border-purple-800/50 flex items-center justify-between max-w-md mx-auto mb-4">
            <code className="text-purple-300 text-xs font-mono overflow-x-auto whitespace-nowrap pr-2">FwqCgnf1H46XtPU2B1aDQRyKMhUpqaWkyuQ4yQ1ibouN</code>
            <button 
              onClick={() => {navigator.clipboard.writeText('FwqCgnf1H46XtPU2B1aDQRyKMhUpqaWkyuQ4yQ1ibouN')}}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              aria-label="Copy contract address"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </div>
          <a 
            href="https://axiom.trade/@lt/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center text-purple-400 hover:text-purple-300 text-sm"
          >
            Trade $PROD on Axiom
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
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