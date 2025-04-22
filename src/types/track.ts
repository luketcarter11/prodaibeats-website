export interface Track {
  id: string
  title: string
  artist: string
  coverUrl: string
  price: number
  bpm: number
  key: string
  duration: string
  tags: string[]
  waveform?: string
  audioUrl: string
  coverImage?: string
  description?: string
  licenseType?: 'Non-Exclusive' | 'Non-Exclusive Plus' | 'Exclusive' | 'Exclusive Plus' | 'Exclusive Pro'
  createdAt?: string
  updatedAt?: string
  plays?: number
  slug?: string
  videoId?: string
  downloadDate?: string
} 