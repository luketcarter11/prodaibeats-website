// This is a skeleton layout for your homepage
// Tailwind CSS is assumed to be installed
// You can wire this into /app/page.tsx and break it into components as needed

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getFeaturedTracks } from '../src/lib/data'
import TrackCard from '../src/components/TrackCard'
import PlatformsScroller from '../src/components/PlatformsScroller'
import LicensingSection from '../src/components/LicensingSection'
import LicenseSelectionModal from '../src/components/LicenseSelectionModal'
import CartPopup from '../src/components/CartPopup'
import AudioPlayer from '../src/components/AudioPlayer'
import { Track } from '@/types/track'
import { useCart } from '../src/context/CartContext'
import TracksGrid from '../components/TracksGrid'

export default function Home() {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([])
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)
  const [isCartPopupOpen, setIsCartPopupOpen] = useState(false)
  const [addedTrack, setAddedTrack] = useState<Track | null>(null)
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<Track | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { cart } = useCart()
  
  useEffect(() => {
    // Fetch tracks data from the API
    async function loadTracks() {
      setIsLoading(true)
      try {
        const tracks = await getFeaturedTracks()
        setFeaturedTracks(tracks)
      } catch (error) {
        console.error('Error loading tracks:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTracks()
  }, [])
  
  const featuredTrack = featuredTracks.length > 0 ? featuredTracks[0] : null // Use the first track as featured
  const isInCart = featuredTrack ? cart.some(item => item.id === featuredTrack.id) : false

  const handleAddToCart = () => {
    if (!featuredTrack) return
    
    if (isInCart) {
      // If already in cart, navigate to cart page
      window.location.href = '/cart'
      return
    }
    
    // Open license selection modal
    setIsLicenseModalOpen(true)
  }
  
  // Handle cart popup close
  const handleCartPopupClose = () => {
    setIsCartPopupOpen(false)
    setAddedTrack(null)
  }

  // Handle license modal close and potentially show cart popup
  const handleLicenseModalClose = (addedItem?: Track | null) => {
    setIsLicenseModalOpen(false)
    
    if (addedItem) {
      setAddedTrack(addedItem)
      setIsCartPopupOpen(true)
    }
  }

  // Handle playing a track
  const handlePlayTrack = (track: Track) => {
    setCurrentPlayingTrack(track)
  }

  // Handle closing the audio player
  const handleClosePlayer = () => {
    setCurrentPlayingTrack(null)
  }

  const handleFeaturedTrackPlay = () => {
    if (featuredTrack) {
      setCurrentPlayingTrack(featuredTrack)
    }
  }

  if (isLoading) {
    return <div className="bg-black min-h-screen flex items-center justify-center text-white">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading tracks...</p>
      </div>
    </div>
  }

  if (!featuredTrack) {
    return <div className="bg-black min-h-screen flex items-center justify-center text-white">
      <p>No tracks available. Please check back later.</p>
    </div>
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Featured Tracks</h1>
        <p className="text-gray-400">Discover and enjoy the latest beats</p>
      </div>
      
      <TracksGrid />
    </main>
  )
}
