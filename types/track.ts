export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  coverImage?: string;
  price?: number;
  bpm?: number;
  key?: string;
  duration?: string;
  tags?: string[];
  genre?: string;
  mood?: string;
  description?: string;
  licenseType?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  plays?: number;
  slug?: string;
  videoId?: string;
  downloadDate?: string;
} 