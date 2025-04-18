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
  description?: string
  licenseType?: 'Non-Exclusive' | 'Non-Exclusive Plus' | 'Exclusive' | 'Exclusive Plus' | 'Exclusive Pro'
  createdAt?: string
  plays?: number
  slug?: string
  videoId?: string
  downloadDate?: string
} 