'use client'

import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { Track } from '@/types/track'

interface LicenseSelectionModalProps {
  isOpen: boolean
  onClose: (addedTrack?: Track | null) => void
  track: Track
}

interface LicenseOption {
  type: string
  price: number
  description: string[]
}

export default function LicenseSelectionModal({ isOpen, onClose, track }: LicenseSelectionModalProps) {
  const { addToCart } = useCart()
  const [selectedLicense, setSelectedLicense] = useState<string | null>('Non-Exclusive')

  const licenses: LicenseOption[] = [
    {
      type: 'Non-Exclusive',
      price: 12.99,
      description: [
        'MP3 File (Tagless)',
        'Up to 100k streams',
        'All platforms',
        '50% royalty split'
      ]
    },
    {
      type: 'Non-Exclusive Plus',
      price: 24.99,
      description: [
        'MP3 File (Tagless)',
        'Unlimited streams',
        'All platforms',
        '40% royalty split'
      ]
    },
    {
      type: 'Exclusive',
      price: 29.99,
      description: [
        'MP3 File (Tagless)',
        'Up to 100k streams',
        'All platforms',
        '50% royalty split',
        'Producer keeps distribution'
      ]
    },
    {
      type: 'Exclusive Plus',
      price: 49.99,
      description: [
        'MP3 File (Tagless)',
        'Unlimited streams',
        'All platforms',
        '30% royalty split',
        'Producer keeps distribution'
      ]
    },
    {
      type: 'Exclusive Pro',
      price: 79.99,
      description: [
        'MP3 File (Tagless)',
        'Unlimited streams',
        'All platforms',
        '10% royalty split',
        'Producer keeps distribution',
        'Free Non-Exclusive Plus beat'
      ]
    }
  ]

  // Handle outside click - stop propagation from the modal content to prevent accidental closing
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // Handle license selection
  const handleSelectLicense = (type: string) => {
    setSelectedLicense(type)
  }

  // Handle add to cart with selected license
  const handleAddToCart = () => {
    if (!selectedLicense) return

    const licenseOption = licenses.find(license => license.type === selectedLicense)
    if (!licenseOption) return

    // Create a new track object with the selected license and updated price
    const trackWithLicense: Track = {
      ...track,
      licenseType: selectedLicense as 'Non-Exclusive' | 'Non-Exclusive Plus' | 'Exclusive' | 'Exclusive Plus' | 'Exclusive Pro',
      price: licenseOption.price
    }

    // Add to cart and pass the added track back to parent
    addToCart(trackWithLicense)
    onClose(trackWithLicense)
  }

  const handleCancel = () => {
    onClose(null)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      <div 
        className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={handleContentClick}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Choose a License</h2>
            <button 
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            Select the perfect license for "{track.title}" based on your needs. All licenses include instant delivery and are backed by our satisfaction guarantee.
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {licenses.map((license) => (
              <div 
                key={license.type}
                className={`
                  ${selectedLicense === license.type
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }
                  ${selectedLicense === license.type
                    ? 'ring-2 ring-white' 
                    : ''
                  }
                  rounded-lg p-5 transition-colors cursor-pointer flex flex-col
                `}
                onClick={() => handleSelectLicense(license.type)}
              >
                <h3 className="text-lg font-bold mb-2">{license.type}</h3>
                <div className={`text-2xl font-bold ${selectedLicense === license.type ? 'text-white' : 'text-purple-400'} mb-4`}>
                  ${license.price}
                </div>
                <ul className="space-y-2 text-sm flex-grow mb-4">
                  {license.description.map((item, index) => (
                    <li key={index} className={`${selectedLicense === license.type ? 'text-white' : 'text-gray-300'}`}>
                      ✓ {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center mt-auto">
                  <input
                    type="radio"
                    id={`license-${license.type}`}
                    name="license"
                    checked={selectedLicense === license.type}
                    onChange={() => handleSelectLicense(license.type)}
                    className="h-4 w-4 text-white border-gray-300 focus:ring-white"
                  />
                  <label 
                    htmlFor={`license-${license.type}`} 
                    className={`ml-2 text-sm ${selectedLicense === license.type ? 'text-white' : 'text-gray-400'}`}
                  >
                    Select {license.type}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end items-center space-x-4">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleAddToCart}
            disabled={!selectedLicense}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
} 