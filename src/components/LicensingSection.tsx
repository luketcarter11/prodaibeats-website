'use client'

import { useEffect, useRef, useState } from 'react'
import { LicensePreviewModal } from './LicensePreviewModal'

export default function LicensingSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const exclusiveCardRef = useRef<HTMLDivElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<{ type: string; price: string } | null>(null)

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

  const handleOpenModal = (type: string, price: string) => {
    setSelectedLicense({ type, price })
    setIsModalOpen(true)
  }

  return (
    <section className="w-full bg-black py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Licensing Options
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Choose the perfect license for your project.<br />
            All licenses include instant delivery and are backed by our satisfaction guarantee.
          </p>
        </div>
      </div>
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
              className="w-full bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm mt-auto">
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
              className="w-full bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm mt-auto">
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
              className="w-full bg-white text-purple-600 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors text-sm mt-auto">
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
              className="w-full bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm mt-auto">
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
              className="w-full bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm mt-auto">
              Explore Exclusive Pro
            </button>
          </div>
        </div>
      </div>

      {selectedLicense && (
        <LicensePreviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          licenseType={selectedLicense.type}
          price={selectedLicense.price}
        />
      )}

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
  )
} 