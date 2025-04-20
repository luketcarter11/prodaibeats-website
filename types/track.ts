export interface Track {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  uploadDate: string;
  audioUrl: string;
  coverUrl?: string;
  price?: number;
  bpm?: number;
  musicalKey?: string;
  key?: string;
  duration?: string;
  tags?: string[];
  genre?: string;
  mood?: string;
  description?: string;
  licenseType?: string;
} 