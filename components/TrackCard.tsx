// components/TrackCard.tsx
'use client'

import Image from 'next/image'
import { FaPlay } from 'react-icons/fa'
import { Track } from '@/types/track'

interface TrackCardProps extends Omit<Track, 'tags'> {
  tags?: string[]
  onPlay: (track: Track) => void
  musicalKey?: string
}

export default function TrackCard({
  id,
  title,
  artist,
  coverUrl,
  price,
  bpm,
  key: musicalKey,
  duration,
  tags = [],
  audioUrl,
  onPlay,
}: TrackCardProps) {
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
    <div className="flex items-center justify-between w-full p-4 hover:bg-white/5 transition-colors rounded-lg group">
      <div className="flex items-center flex-1">
        <div className="relative w-12 h-12 mr-4 group-hover:opacity-80 transition-opacity">
          <Image
            src={coverUrl}
            alt={title ?? 'Untitled Track'}
            fill
            className="object-cover rounded"
          />
          <button 
            onClick={() => onPlay({ 
              id, 
              title, 
              artist, 
              coverUrl, 
              price, 
              bpm, 
              key: musicalKey || '', 
              duration, 
              tags, 
              audioUrl 
            })}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FaPlay className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-medium truncate whitespace-nowrap overflow-hidden max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]">{title}</h3>
          <p className="text-gray-400 text-sm truncate">{artist}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>{duration}</span>
            <span>{bpm} BPM</span>
            <span>{musicalKey}</span>
          </div>
        </div>
      </div>
      <div className="hidden md:flex items-center space-x-2 mx-4">
        {filteredTags.map((tag) => (
          <span key={tag} className="px-3 py-1 text-sm bg-white/10 text-gray-300 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        </button>
        <button className="px-4 py-2 bg-[#a259ff] hover:bg-[#8c43e9] text-white rounded font-medium transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386a2.25 2.25 0 012.17 1.684l.298 1.192M6.104 5.876l1.347 5.39m0 0l.298 1.192A2.25 2.25 0 009.92 14.25h7.358a2.25 2.25 0 002.17-1.684l1.386-5.544A1.125 1.125 0 0019.733 5.25H6.104zm0 0L4.5 9.75m16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-10.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          </svg>
          ${(price ?? 0).toFixed(2)}
        </button>
      </div>
    </div>
  )
}
