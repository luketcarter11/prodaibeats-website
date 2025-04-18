'use client';

import Image from 'next/image';

interface Platform {
  name: string
  url: string
  icon: string
  invertColors?: boolean
}

const platforms: Platform[] = [
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/artist/6rtcV1PtuVS90XXBUrATdl',
    icon: '/platforms/spotify.svg'
  },
  {
    name: 'Apple Music',
    url: 'https://music.apple.com/gb/artist/prod-ai/1805435269',
    icon: '/platforms/apple-music.svg'
  },
  {
    name: 'Amazon Music',
    url: 'https://music.amazon.co.uk/artists/B0F3199RHN/prod-ai',
    icon: '/platforms/amazon-music.svg',
    invertColors: true
  },
  {
    name: 'YouTube Music',
    url: 'https://music.youtube.com/channel/UCf8GBn4oMPCCZKLhFazgYlA',
    icon: '/platforms/youtube-music.svg'
  },
  {
    name: 'TikTok',
    url: '#',
    icon: '/platforms/tiktok.svg'
  },
  {
    name: 'Deezer',
    url: 'https://dzr.page.link/2uNYT97z1RwZmVW6A',
    icon: '/platforms/deezer.svg'
  },
  {
    name: 'iHeartRadio',
    url: 'https://www.iheart.com/artist/prod-ai-46325943/',
    icon: '/platforms/iheartradio.svg',
    invertColors: true
  }
]

export default function PlatformsScroller() {
  return (
    <section 
      className="py-10 bg-black"
      aria-labelledby="platforms-heading"
    >
      <div className="max-w-7xl mx-auto px-4">
        <h2 
          id="platforms-heading"
          className="text-3xl font-bold text-white mb-2 text-center"
        >
          Find us on:
        </h2>
        <p className="text-sm text-gray-400 mb-12 text-center">
          Stream our beats on your favorite platforms
        </p>
        <div 
          className="flex flex-wrap items-center justify-center gap-12 sm:gap-16 md:gap-24"
          role="list"
          aria-label="Music streaming platforms"
        >
          {platforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
              aria-label={`Listen to our music on ${platform.name}`}
            >
              <img 
                src={platform.icon} 
                alt={`${platform.name} logo`}
                className={`w-full h-full ${platform.invertColors ? 'brightness-0 invert' : ''}`}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
} 