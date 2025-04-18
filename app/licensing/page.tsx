'use client'

import { useEffect, useRef, useState } from 'react'
import { LicensePreviewModal } from '../../src/components/LicensePreviewModal'

interface LicenseType {
  name: string
  price: string
}

export default function LicensingPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const exclusiveCardRef = useRef<HTMLDivElement>(null)
  const [selectedLicense, setSelectedLicense] = useState<LicenseType | null>(null)

  useEffect(() => {
    if (scrollContainerRef.current && exclusiveCardRef.current) {
      const container = scrollContainerRef.current
      const card = exclusiveCardRef.current
      const containerWidth = container.offsetWidth
      const cardLeft = card.offsetLeft
      const cardWidth = card.offsetWidth
      
      // Calculate scroll position to center the exclusive card
      const scrollTo = cardLeft - (containerWidth / 2) + (cardWidth / 2)
      container.scrollLeft = scrollTo
    }
  }, [])

  const handleOpenModal = (licenseName: string, price: string) => {
    setSelectedLicense({ name: licenseName, price })
  }

  const handleCloseModal = () => {
    setSelectedLicense(null)
  }

  return (
    <main className="bg-black">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-gray-900 to-black py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Licensing Options</h1>
          <p className="text-gray-400">
            Choose the perfect license for your project. All licenses include instant delivery and are backed by our satisfaction guarantee.
          </p>
        </div>
      </section>

      {/* License Cards */}
      <section className="w-full bg-black py-0">
        <div ref={scrollContainerRef} className="flex overflow-x-auto no-scrollbar pb-20">
          <div className="flex gap-6 mx-8 md:mx-auto pt-4">
            {/* Non-Exclusive License */}
            <div className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-colors flex-none flex flex-col w-[280px]">
              <h3 className="text-xl font-bold text-white mb-4">Non-Exclusive</h3>
              <div className="text-2xl font-bold text-purple-500 mb-6">$12.99</div>
              <ul className="space-y-3 text-gray-300 mb-8 text-sm flex-grow">
                <li>✓ MP3 File (Tagless)</li>
                <li>✓ Up to 100k streams</li>
                <li>✓ All platforms</li>
                <li>✓ 50% royalty split</li>
              </ul>
              <button 
                onClick={() => handleOpenModal('Non-Exclusive', '12.99')}
                className="w-full bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm mt-auto"
              >
                Explore Non-Exclusive
              </button>
            </div>

            {/* Non-Exclusive Plus License */}
            <div className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-colors flex-none flex flex-col w-[280px]">
              <h3 className="text-xl font-bold text-white mb-4">Non-Exclusive Plus</h3>
              <div className="text-2xl font-bold text-purple-500 mb-6">$24.99</div>
              <ul className="space-y-3 text-gray-300 mb-8 text-sm flex-grow">
                <li>✓ MP3 File (Tagless)</li>
                <li>✓ Unlimited streams</li>
                <li>✓ All platforms</li>
                <li>✓ 40% royalty split</li>
              </ul>
              <button 
                onClick={() => handleOpenModal('Non-Exclusive Plus', '24.99')}
                className="w-full bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm mt-auto"
              >
                Explore Non-Exclusive Plus
              </button>
            </div>

            {/* Exclusive License */}
            <div ref={exclusiveCardRef} className="bg-purple-600 rounded-lg p-6 hover:bg-purple-700 transition-colors transform scale-105 flex-none flex flex-col w-[280px]">
              <h3 className="text-xl font-bold text-white mb-4">Exclusive</h3>
              <div className="text-2xl font-bold text-white mb-6">$29.99</div>
              <ul className="space-y-3 text-white mb-8 text-sm flex-grow">
                <li>✓ MP3 File (Tagless)</li>
                <li>✓ Up to 100k streams</li>
                <li>✓ All platforms</li>
                <li>✓ 50% royalty split</li>
                <li>✓ Producer keeps distribution</li>
              </ul>
              <button 
                onClick={() => handleOpenModal('Exclusive', '29.99')}
                className="w-full bg-white text-purple-600 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors text-sm mt-auto"
              >
                Explore Exclusive
              </button>
            </div>

            {/* Exclusive Plus License */}
            <div className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-colors flex-none flex flex-col w-[280px]">
              <h3 className="text-xl font-bold text-white mb-4">Exclusive Plus</h3>
              <div className="text-2xl font-bold text-purple-500 mb-6">$49.99</div>
              <ul className="space-y-3 text-gray-300 mb-8 text-sm flex-grow">
                <li>✓ MP3 File (Tagless)</li>
                <li>✓ Unlimited streams</li>
                <li>✓ All platforms</li>
                <li>✓ 30% royalty split</li>
                <li>✓ Producer keeps distribution</li>
              </ul>
              <button 
                onClick={() => handleOpenModal('Exclusive Plus', '49.99')}
                className="w-full bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm mt-auto"
              >
                Explore Exclusive Plus
              </button>
            </div>

            {/* Exclusive Pro License */}
            <div className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-colors flex-none flex flex-col w-[280px]">
              <h3 className="text-xl font-bold text-white mb-4">Exclusive Pro</h3>
              <div className="text-2xl font-bold text-purple-500 mb-6">$79.99</div>
              <ul className="space-y-3 text-gray-300 mb-8 text-sm flex-grow">
                <li>✓ MP3 File (Tagless)</li>
                <li>✓ Unlimited streams</li>
                <li>✓ All platforms</li>
                <li>✓ 10% royalty split</li>
                <li>✓ Producer keeps distribution</li>
                <li>✓ Free Non-Exclusive Plus beat</li>
              </ul>
              <button 
                onClick={() => handleOpenModal('Exclusive Pro', '79.99')}
                className="w-full bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm mt-auto"
              >
                Explore Exclusive Pro
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </section>

      {/* License Preview Modal */}
      <LicensePreviewModal
        isOpen={selectedLicense !== null}
        onClose={handleCloseModal}
        licenseType={selectedLicense?.name || ''}
        price={selectedLicense?.price || ''}
      />

      {/* Additional Information */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Additional Information</h2>
          
          <div className="space-y-6 text-gray-400">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">License Delivery</h3>
              <p>After purchase, you'll receive an instant download link for your files and a PDF copy of your license agreement.</p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">Usage Terms</h3>
              <p>All licenses are non-exclusive unless specified as exclusive. You can use the beat immediately after purchase, following the terms outlined in your chosen license tier.</p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">Important Notes</h3>
              <ul className="list-none space-y-2">
                {[
                  'Licenses are non-refundable and non-transferable',
                  'Credit must be given as "Prod. by ProdAI Beats" in song titles',
                  'Resale or redistribution of beats is not permitted',
                  'For questions about licensing, contact our support team'
                ].map((note) => (
                  <li key={note} className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 