export type MusicalKey = 
  | 'C' | 'Cm' | 'C#' | 'C#m' | 'Db' | 'Dbm'
  | 'D' | 'Dm' | 'D#' | 'D#m' | 'Eb' | 'Ebm'
  | 'E' | 'Em'
  | 'F' | 'Fm' | 'F#' | 'F#m' | 'Gb' | 'Gbm'
  | 'G' | 'Gm' | 'G#' | 'G#m' | 'Ab' | 'Abm'
  | 'A' | 'Am' | 'A#' | 'A#m' | 'Bb' | 'Bbm'
  | 'B' | 'Bm'

export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  musicalKey: MusicalKey;
  coverImage: string;
  audioFile: string;
  price: {
    nonExclusive: number;
    exclusive?: number;
    unlimited?: number;
  };
  genre?: string;
  mood?: string;
  duration?: number;
  dateAdded: string;
  featured?: boolean;
}

export interface LicenseType {
  id: 'non-exclusive' | 'exclusive' | 'unlimited';
  name: string;
  description: string;
  features: string[];
  price: number;
} 