import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import TrackCard from '@/components/TrackCard'
import LicenseTier from '@/components/LicenseTier'
import PlatformLink from '@/components/PlatformLink'
import Player from '@/components/Player'
import { getFeaturedTracks, getNewReleases, licenseTiers, platforms } from '@/lib/data'
import { Track } from '@/types/track'
import PlatformsScroller from '@/components/PlatformsScroller'

// Temporary mock data
const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Damn [Anderson .Paak ~ Mac Miller]',
    artist: 'PROD AI',
    coverUrl: '/images/covers/track1.jpg',
    price: 24.99,
    bpm: 106,
    key: 'Am',
    duration: '03:41',
    tags: ['mac miller', 'anderson paak', 'hip hop'],
    audioUrl: '/audio/track1.mp3'
  },
  {
    id: '2',
    title: 'Britney [2000s ~ Pop]',
    artist: 'PROD AI',
    coverUrl: '/images/covers/track2.jpg',
    price: 24.99,
    bpm: 129,
    key: 'C',
    duration: '02:23',
    tags: ['pop', 'rnb', '2000s'],
    audioUrl: '/audio/track2.mp3'
  },
  {
    id: '3',
    title: 'Summer Nights [Drake Type Beat]',
    artist: 'PROD AI',
    coverUrl: '/images/covers/track3.jpg',
    price: 29.99,
    bpm: 95,
    key: 'Gm',
    duration: '03:15',
    tags: ['drake', 'rnb', 'trap'],
    audioUrl: '/audio/track3.mp3'
  },
  {
    id: '4',
    title: 'Neon Dreams [Synthwave]',
    artist: 'PROD AI',
    coverUrl: '/images/covers/track4.jpg',
    price: 19.99,
    bpm: 120,
    key: 'F',
    duration: '04:02',
    tags: ['synthwave', 'electronic', 'retro'],
    audioUrl: '/audio/track4.mp3'
  }
]

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Search Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="w-[90%] max-w-md">
              <input
                type="text"
                placeholder="Search beats..."
                className="w-full h-14 px-6 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Beats */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Featured Beats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Suspense fallback={<div>Loading tracks...</div>}>
              <FeaturedTracks />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <PlatformsScroller />

      {/* Features Section */}
      <section className="py-12 bg-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Why Choose Our Beats?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-white/10">
              <h3 className="text-xl font-semibold mb-4">High Quality</h3>
              <p className="text-white/70">Professional grade beats produced with industry-standard tools and techniques.</p>
            </div>
            <div className="p-6 rounded-lg bg-white/10">
              <h3 className="text-xl font-semibold mb-4">Unique Style</h3>
              <p className="text-white/70">Stand out with our signature sound that blends modern trends with timeless elements.</p>
            </div>
            <div className="p-6 rounded-lg bg-white/10">
              <h3 className="text-xl font-semibold mb-4">Instant Delivery</h3>
              <p className="text-white/70">Get your beats immediately after purchase, ready to use in your next project.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your Next Hit?</h2>
          <p className="text-xl mb-8">Browse our collection and find the perfect beat for your project.</p>
          <button className="px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-opacity-90 transition-all">
            Start Shopping
          </button>
        </div>
      </section>
    </main>
  )
}

// Separate async component for data fetching
async function FeaturedTracks() {
  try {
    const tracks = await getFeaturedTracks()
    return (
      <>
        {tracks.map((track) => {
          const { key, ...trackWithoutKey } = track;
          return (
            <TrackCard
              key={track.id}
              {...trackWithoutKey}
              musicalKey={track.key ?? 'C'}
            />
          );
        })}
      </>
    )
  } catch (error) {
    console.error('Error fetching tracks:', error)
    return <div>Error loading tracks. Please try again later.</div>
  }
} 