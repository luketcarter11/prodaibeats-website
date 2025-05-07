'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FaPlay, FaShoppingCart } from 'react-icons/fa'
import { Track } from '@/types/track'
import { useCart } from '../context/CartContext'
import LicenseSelectionModal from './LicenseSelectionModal'
import CartPopup from './CartPopup'

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev'

// Helper function to format duration to mm:ss
function formatDuration(seconds: number | string): string {
  const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (isNaN(totalSeconds)) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

interface TrackCardProps extends Omit<Track, 'key'> {
  musicalKey: string
  onPlay?: (track: Track) => void
  onDownload?: (track: Track) => void
  onShare?: (track: Track) => void
  licenseType?: 'Non-Exclusive' | 'Non-Exclusive Plus' | 'Exclusive' | 'Exclusive Plus' | 'Exclusive Pro'
}

export default function TrackCard({
  id,
  title,
  artist,
  coverUrl,
  price,
  bpm,
  musicalKey,
  duration,
  tags = [],
  audioUrl,
  licenseType = 'Non-Exclusive',
  onPlay,
  onDownload,
  onShare
}: TrackCardProps) {
  const { addToCart, cart } = useCart()
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)
  const [isCartPopupOpen, setIsCartPopupOpen] = useState(false)
  const [addedTrack, setAddedTrack] = useState<Track | null>(null)
  const isInCart = cart.some(item => item.id === id)
  
  // Ensure proper cover URL with fallback to CDN
  const coverSrc = coverUrl && coverUrl.includes('://') 
    ? coverUrl 
    : `${CDN}/covers/${id}.jpg`

  const track: Track = { 
    id, 
    title, 
    artist, 
    coverUrl: coverSrc, // Use the corrected cover URL
    price, 
    bpm, 
    key: musicalKey, 
    duration, 
    tags, 
    audioUrl,
    licenseType 
  }

  const handlePlay = () => {
    onPlay?.(track)
  }

  const handleDownload = () => {
    try {
      // Get the correct audio URL
      const downloadUrl = track.audioUrl || `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev'}/tracks/${id}.mp3`;
      
      // Create an invisible anchor element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title || 'track'}.mp3`; // Set filename
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

  const handleShare = () => {
    onShare?.(track)
  }

  const handleAddToCart = () => {
    if (isInCart) {
      // If already in cart, navigate to cart page or show cart
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

  // Filter unwanted tags
  const filteredTags = tags.filter(tag => {
    // Skip artist name tag
    if (tag.toLowerCase() === 'prod ai' || (artist && tag.toLowerCase() === artist.toLowerCase())) {
      return false;
    }
    
    // Skip tags that are just the track title or parts of it
    if (title && title.toLowerCase().includes(tag.toLowerCase())) {
      return false;
    }
    
    // Skip tags that are BPM info since we display that separately
    if (/^\d{2,3}\s*bpm$/i.test(tag) || tag.toLowerCase().includes('bpm')) {
      return false;
    }
    
    return true;
  });

  return (
    <>
      <div 
        className="flex items-center justify-between w-full bg-transparent p-0"
        role="article"
        aria-label={`Track: ${title} by ${artist}`}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="relative w-12 h-12 mr-4 flex-shrink-0 group-hover:opacity-80 transition-opacity">
            <Image
              src={coverSrc}
              alt={`Cover art for ${title}`}
              fill
              unoptimized
              className="object-cover rounded"
            />
            <button 
              onClick={handlePlay}
              onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Play ${title}`}
              tabIndex={0}
            >
              <FaPlay className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="flex items-center w-full min-w-0">
            <h3 className="flex-1 text-white font-medium truncate">{title}</h3>
            <button 
              onClick={handleAddToCart}
              className={`ml-4 flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold px-4 py-2.5 text-base transition-colors flex items-center justify-center ${isInCart ? 'opacity-60 cursor-not-allowed' : ''}`}
              aria-label={isInCart ? `${title} is in your cart` : `Add ${title} to cart`}
              disabled={isInCart}
            >
              <FaShoppingCart className="w-5 h-5 mr-0 md:mr-2 mx-auto" />
              <span className="hidden md:inline font-normal">${(price ?? 0).toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* License Selection Modal with track info passed to it */}
      <LicenseSelectionModal
        isOpen={isLicenseModalOpen}
        onClose={(track) => {
          setIsLicenseModalOpen(false);
          if (track) {
            setAddedTrack(track);
            setIsCartPopupOpen(true);
          }
        }}
        track={track}
      />

      {/* Cart Popup */}
      <CartPopup 
        isOpen={isCartPopupOpen} 
        onClose={handleCartPopupClose} 
        addedTrack={addedTrack} 
      />
    </>
  )
} 