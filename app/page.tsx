// This is a skeleton layout for your homepage
// Tailwind CSS is assumed to be installed
// You can wire this into /app/page.tsx and break it into components as needed

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useCart } from '../src/context/CartContext'
import TrackCard from '../src/components/TrackCard'
import LicensingSection from '../src/components/LicensingSection'
import PlatformsScroller from '../src/components/PlatformsScroller'
import AudioPlayer from '../src/components/AudioPlayer'
import LicenseSelectionModal from '../src/components/LicenseSelectionModal'
import CartPopup from '../src/components/CartPopup'
import { Track } from '@/types/track'

// For backward compatibility with existing components
type SrcTrack = {
  id: string
  title: string
  artist: string
  coverUrl: string
  coverImage?: string
  audioUrl: string
  downloadDate?: string
  createdAt?: string
  uploadDate?: string
}

// Union type for different track formats
type AnyTrack = Track | SrcTrack

// Type guards for track formats
function hasCoverUrl(track: AnyTrack): track is Track {
  return 'coverUrl' in track && typeof track.coverUrl === 'string'
}

function hasCoverImage(track: AnyTrack): track is SrcTrack {
  return 'coverImage' in track && typeof track.coverImage === 'string'
}

export default function Home() {
  const [featuredTracks, setFeaturedTracks] = useState<AnyTrack[]>([])
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)
  const [isCartPopupOpen, setIsCartPopupOpen] = useState(false)
  const [addedTrack, setAddedTrack] = useState<AnyTrack | null>(null)
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<AnyTrack | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { cart } = useCart()
  
  // Fetch tracks data from the API instead of using getFeaturedTracks directly
  useEffect(() => {
    async function loadTracks() {
      setIsLoading(true)
      try {
        console.log('🔄 Home: Fetching tracks from API')
        const response = await fetch('/api/tracks')
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format - expected array of tracks')
        }
        
        console.log(`✅ Home: Received ${data.length} tracks from API`)
        setFeaturedTracks(data)
      } catch (error) {
        console.error('Error loading tracks:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTracks()
  }, [])
  
  const featuredTrack = featuredTracks.length > 0 ? featuredTracks[0] : null // Use the first track as featured
  const isInCart = featuredTrack ? cart.some((item: any) => item.id === featuredTrack.id) : false

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
  const handleLicenseModalClose = (addedItem?: any) => {
    setIsLicenseModalOpen(false)
    
    if (addedItem) {
      setAddedTrack(addedItem)
      setIsCartPopupOpen(true)
    }
  }

  // Handle playing a track
  const handlePlayTrack = (track: AnyTrack) => {
    setCurrentPlayingTrack(track)
  }

  // Handle closing the audio player
  const handleClosePlayer = () => {
    setCurrentPlayingTrack(null)
  }

  // Handle track download
  const handleDownload = (track: AnyTrack) => {
    try {
      // Get the correct audio URL
      const downloadUrl = track.audioUrl && track.audioUrl.includes('://') 
        ? track.audioUrl 
        : `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev'}/tracks/${track.id}.mp3`;
      
      // Create an invisible anchor element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${track.title || 'track'}.mp3`; // Set filename
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error('Failed to start download:', error);
    }
  };

  // Helper to get BPM safely
  const getBpm = (track: AnyTrack): number => {
    if (hasCoverUrl(track)) {
      return track.bpm ?? 0;
    }
    return 0;
  }

  // Helper to get price safely
  const getPrice = (track: AnyTrack): number => {
    if (hasCoverUrl(track)) {
      return track.price ?? 0;
    }
    return 0;
  }

  // Helper to get key safely
  const getKey = (track: AnyTrack): string => {
    if (hasCoverUrl(track)) {
      return track.key ?? 'C';
    }
    return 'C';
  }

  // Helper to get duration safely
  const getDuration = (track: AnyTrack): string => {
    if (hasCoverUrl(track)) {
      return track.duration ?? '0:00';
    }
    return '0:00';
  }

  // Helper to get tags safely
  const getTags = (track: AnyTrack): string[] => {
    if (hasCoverUrl(track)) {
      return track.tags ?? [];
    }
    return [];
  }

  // Helper function to get the cover image safely from either track format
  const getCoverImage = (track: AnyTrack): string => {
    if (hasCoverUrl(track)) {
      return track.coverUrl;
    } 
    if (hasCoverImage(track)) {
      return track.coverImage ?? '/images/default-cover.jpg';
    }
    return '/images/default-cover.jpg';
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
    return <div className="bg-black min-h-screen flex items-center justify-center text-white">No tracks available.</div>
  }

  return (
    <main className="bg-black">
      {/* Featured Track Hero */}
      <section className="w-full bg-gradient-to-b from-gray-900 to-black py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="relative w-48 h-48 mx-auto mb-6">
            <Image
              src={getCoverImage(featuredTrack) || '/images/default-cover.jpg'}
              alt={featuredTrack.title ?? 'Untitled Track'}
              fill
              unoptimized
              className="object-cover rounded-lg"
            />
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={() => handlePlayTrack(featuredTrack)}
            >
              <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-2">Featured Track • {getBpm(featuredTrack)}BPM</p>
          <h1 className="text-2xl font-bold text-white mb-6">{featuredTrack.title}</h1>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleAddToCart}
              className={`bg-purple-600 text-white px-6 py-2 rounded-md flex items-center gap-2 hover:bg-purple-700 transition-colors ${
                isInCart ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
            >
              {isInCart ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">In Cart</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                  </svg>
                  <span className="font-medium">${getPrice(featuredTrack)}</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleDownload(featuredTrack)}
              className="text-white hover:text-purple-400 transition-colors p-2 rounded-full bg-white/10 hover:bg-white/20"
              aria-label={`Download ${featuredTrack.title}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="w-full bg-black py-4">
        <div className="w-[95%] max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search beats..."
              className="flex-1 h-12 sm:h-14 bg-white text-black px-4 py-2 sm:py-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-500"
            />
            <button className="absolute right-1 h-10 sm:h-12 bg-purple-600 text-white px-6 rounded-md font-medium hover:bg-purple-700 transition-colors">
              SEARCH
            </button>
          </div>
        </div>
      </div>

      {/* Featured Beats */}
      <section className="relative py-4 px-6 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-2">
            {featuredTracks.slice(0, 20).map((track) => (
              <div key={track.id}>
                <TrackCard
                  id={track.id}
                  title={track.title ?? 'Untitled Track'}
                  artist={track.artist ?? 'Unknown Artist'}
                  coverUrl={track.coverUrl}
                  price={getPrice(track)}
                  bpm={getBpm(track)}
                  musicalKey={getKey(track)}
                  duration={getDuration(track)}
                  tags={getTags(track)}
                  audioUrl={track.audioUrl}
                  onPlay={() => handlePlayTrack(track)}
                />
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/beats"
              className="bg-purple-600 text-white px-8 py-3 rounded-md font-medium hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
            >
              View All Beats
            </Link>
          </div>
        </div>
      </section>
      {/* Gradient Divider */}
      <div className="w-full h-[1px] bg-gradient-to-r from-purple-600/60 via-white/10 to-purple-600/60 my-12"></div>

      {/* Licensing Section */}
      <LicensingSection />

      {/* Gradient Divider */}
      <div className="w-full h-[1px] bg-gradient-to-r from-purple-600/60 via-white/10 to-purple-600/60 my-12"></div>

      {/* Find Us On Section */}
      <section className="py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-16 md:gap-24">
            <PlatformsScroller />
          </div>
        </div>
      </section>
      
      {/* Audio Player */}
      {currentPlayingTrack && (
        <AudioPlayer
          currentTrack={currentPlayingTrack as any}
          onClose={handleClosePlayer}
        />
      )}
      
      {/* License Selection Modal */}
      {featuredTrack && (
        <LicenseSelectionModal
          isOpen={isLicenseModalOpen}
          onClose={handleLicenseModalClose}
          track={featuredTrack as any}
        />
      )}
      
      {/* Cart Popup */}
      <CartPopup 
        isOpen={isCartPopupOpen} 
        onClose={handleCartPopupClose} 
        addedTrack={addedTrack as any} 
      />
    </main>
  )
}