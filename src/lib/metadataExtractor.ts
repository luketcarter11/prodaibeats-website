import { MusicalKey } from '@/types'

interface ExtractedMetadata {
  bpm?: number;
  key?: MusicalKey;
  mood?: string;
  genre?: string;
}

// Define common moods for beats
const AVAILABLE_MOODS = [
  'Aggressive', 'Angry', 'Atmospheric', 'Bouncy', 'Bright', 'Calm',
  'Chilled', 'Confident', 'Dark', 'Dreamy', 'Dramatic', 'Driving',
  'Emotional', 'Energetic', 'Epic', 'Ethereal', 'Exciting', 'Fun',
  'Funky', 'Futuristic', 'Gentle', 'Glitchy', 'Gloomy', 'Groovy',
  'Happy', 'Hard', 'Haunting', 'Heavy', 'Hopeful', 'Hypnotic',
  'Inspiring', 'Intense', 'Intimate', 'Laid-back', 'Light', 'Meditative',
  'Melancholic', 'Melodic', 'Mellow', 'Menacing', 'Minimal', 'Mysterious',
  'Nostalgic', 'Organic', 'Peaceful', 'Playful', 'Powerful', 'Reflective',
  'Relaxed', 'Sad', 'Sensual', 'Serious', 'Smooth', 'Soothing',
  'Soulful', 'Spacey', 'Tense', 'Thoughtful', 'Trippy', 'Upbeat',
  'Uplifting', 'Vibrant', 'Warm'
];

// Extended genre keywords
const GENRE_KEYWORDS = [
  'Trap', 'Drill', 'UK Drill', 'Hip Hop', 'Hip-Hop', 'RnB', 'R&B', 'Lo-Fi', 'LoFi',
  'Pop', 'Rock', 'Electronic', 'EDM', 'House', 'Techno', 'Dubstep',
  'Reggae', 'Reggaeton', 'Afrobeat', 'Jazz', 'Soul', 'Funk',
  'Ambient', 'Classical', 'Orchestral', 'Cinematic', 'Synthwave',
  'Indie', 'Alternative', 'Metal', 'Punk', 'Country', 'Folk',
  'Latin', 'Blues', 'Disco', 'Dance', 'Boom Bap', 'Phonk', 'Club',
  'Grime', 'Jersey Club', 'Plugg', 'Hyper Pop', 'Melodic', 'Chill',
  'Experimental', 'Trance', 'Future Bass', 'Hybrid', 'Dirty South',
  'West Coast', 'East Coast', 'Mumble Rap', 'Old School', 'New School'
];

/**
 * Utility to extract BPM, key, mood and genre from a track title
 * 
 * Supports formats like:
 * - "Track Name [140 BPM] [Am]"
 * - "Track Name - 140BPM - Am"
 * - "Track Name | Ambient | 85bpm | Gm"
 * - "Dark Trap Beat - 150 BPM - Melodic"
 */
export const extractMetadataFromTitle = (title: string): ExtractedMetadata => {
  const metadata: ExtractedMetadata = {}
  
  // Extract BPM using regex patterns
  const bpmPatterns = [
    /\[(\d{2,3})\s*(?:bpm|BPM)\]/i,                  // [140 BPM]
    /\|?\s*(\d{2,3})\s*(?:bpm|BPM)\s*\|?/i,          // | 140 BPM |
    /\s+(\d{2,3})\s*(?:bpm|BPM)/i,                   // 140 BPM
    /-\s*(\d{2,3})\s*(?:bpm|BPM)/i,                  // - 140 BPM
    /\((\d{2,3})\s*(?:bpm|BPM)\)/i,                  // (140 BPM)
    /\s+(\d{2,3})(?=\s|$)/                           // Just "140" at word boundary
  ]
  
  for (const pattern of bpmPatterns) {
    const match = title.match(pattern)
    if (match && match[1]) {
      const bpm = parseInt(match[1], 10)
      if (bpm >= 60 && bpm <= 200) { // Reasonable BPM range
        metadata.bpm = bpm
        break
      }
    }
  }
  
  // Extract musical key
  const keyPatterns = [
    /\[([A-G][b#]?m?)\]/i,                           // [Am], [C#], [Gbm]
    /\|?\s*([A-G][b#]?m?)\s*\|?/i,                   // | Am |, | C# |
    /\s+([A-G][b#]?m?)\s*(?:key|KEY)?/i,             // Am key, C# KEY
    /-\s*([A-G][b#]?m?)\s*(?:key|KEY)?/i,            // - Am key
    /\(([A-G][b#]?m?)\)/i,                           // (Am)
    /\s+([A-G][b#]?m?)(?=\s|$)/i                     // Space then Am at word boundary
  ]
  
  // List of valid musical keys
  const validKeys: MusicalKey[] = [
    'C', 'Cm', 'C#', 'C#m', 'Db', 'Dbm',
    'D', 'Dm', 'D#', 'D#m', 'Eb', 'Ebm',
    'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 
    'Gb', 'Gbm', 'G', 'Gm', 'G#', 'G#m',
    'Ab', 'Abm', 'A', 'Am', 'A#', 'A#m',
    'Bb', 'Bbm', 'B', 'Bm'
  ]
  
  for (const pattern of keyPatterns) {
    const match = title.match(pattern)
    if (match && match[1]) {
      // Normalize the key format (capitalize first letter, lowercase 'm' for minor)
      let key = match[1].replace(/m$/i, 'm')
      key = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
      
      // Check if it's a valid key
      if (validKeys.includes(key as MusicalKey)) {
        metadata.key = key as MusicalKey
        break
      }
    }
  }
  
  // Extract mood using fuzzy matching
  metadata.mood = findBestMoodMatch(title);
  
  // Extract genre
  metadata.genre = findBestGenreMatch(title);
  
  return metadata
}

/**
 * Use fuzzy matching to find the best mood match for a title
 */
function findBestMoodMatch(title: string): string | undefined {
  // Simple exact matching for any mood in the title
  for (const mood of AVAILABLE_MOODS) {
    // Case insensitive word boundary match
    const regex = new RegExp(`\\b${mood}\\b`, 'i')
    if (regex.test(title)) {
      return mood
    }
  }
  
  // Extract words from the title (excluding common beat-related terms)
  const words = title
    .replace(/\d+\s*(bpm|beat)/gi, '') // Remove BPM/beat references
    .replace(/type\s*beat/gi, '')      // Remove "type beat"
    .replace(/[^\w\s]/g, ' ')          // Replace non-alphanumeric with spaces
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)    // Only consider words longer than 2 chars
    .filter(word => !['the', 'and', 'for', 'with', 'feat', 'prod', 'by'].includes(word))
  
  // Score each mood against the words in the title
  let bestMatch: { mood: string, score: number } | null = null;
  
  for (const mood of AVAILABLE_MOODS) {
    // Skip if mood is already accounted for in exact match
    
    // Calculate similarity score
    const score = getSimilarityScore(words, mood.toLowerCase());
    
    // Update best match if this score is higher
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { mood, score };
    }
  }
  
  // Use semantic association for certain words if no strong match found
  if (!bestMatch || bestMatch.score < 0.3) {
    const moodAssociations: Record<string, string[]> = {
      'Dark': ['river', 'deep', 'night', 'shadow', 'gloomy', 'black', 'underground', 'murky'],
      'Aggressive': ['hard', 'heavy', 'intense', 'battle', 'fight', 'war', 'slap', 'bang'],
      'Emotional': ['heart', 'love', 'pain', 'soul', 'feel', 'feeling', 'emotions'],
      'Energetic': ['hype', 'energy', 'fire', 'lit', 'jump', 'bounce', 'turn'],
      'Chill': ['slow', 'vibe', 'wave', 'cruise', 'float', 'smoke', 'lean'],
      'Melancholy': ['sad', 'blue', 'alone', 'lost', 'tears', 'rain', 'miss', 'gone'],
      'Atmospheric': ['space', 'cloud', 'sky', 'ambient', 'float', 'dream'],
      'Uplifting': ['rise', 'up', 'high', 'above', 'heaven', 'hope', 'better']
    }
    
    for (const [mood, associations] of Object.entries(moodAssociations)) {
      for (const word of words) {
        if (associations.includes(word)) {
          return mood;
        }
      }
    }
  }
  
  return bestMatch?.mood;
}

/**
 * Use fuzzy matching to find the best genre match for a title
 */
function findBestGenreMatch(title: string): string | undefined {
  // First try exact match for any genre
  for (const genre of GENRE_KEYWORDS) {
    const escapedGenre = genre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedGenre}\\b`, 'i')
    if (regex.test(title)) {
      return genre;
    }
  }
  
  // Check for compound genres (e.g., "UK Drill")
  // Since we've already checked for exact matches, we need to look for partial matches
  const lowerTitle = title.toLowerCase();
  
  for (const genre of GENRE_KEYWORDS) {
    // Only check compound genres (those with spaces)
    if (genre.includes(' ')) {
      const parts = genre.toLowerCase().split(' ');
      
      // Check if all parts appear in the title
      if (parts.every(part => lowerTitle.includes(part))) {
        // If parts are close to each other, consider it a match
        // This is a simple proximity check
        return genre;
      }
    }
  }
  
  // Check for genre indicators like "Type Beat"
  if (/type\s*beat/i.test(title)) {
    // Look for what comes before "type beat"
    const match = title.match(/(\w+(?:\s+\w+)?)\s+type\s*beat/i);
    if (match && match[1]) {
      const genreCandidate = match[1].trim();
      
      // See if it matches any known genre
      for (const genre of GENRE_KEYWORDS) {
        if (genre.toLowerCase() === genreCandidate.toLowerCase()) {
          return genre;
        }
      }
      
      // Return the candidate if it seems like a genre
      if (genreCandidate.length > 2 && !/^\d+$/.test(genreCandidate)) {
        // Capitalize first letter of each word
        return genreCandidate.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }
  }
  
  return undefined;
}

/**
 * Calculate similarity score between words and a target string
 */
function getSimilarityScore(words: string[], target: string): number {
  // If target appears in words array, return a high score
  if (words.includes(target)) {
    return 1.0;
  }
  
  // If any word is a subset of target or vice versa
  for (const word of words) {
    if (target.includes(word) || word.includes(target)) {
      // Calculate similarity based on length ratio of the matching portion
      const matchRatio = Math.min(word.length / target.length, target.length / word.length);
      return matchRatio * 0.8; // Scale a bit lower than exact match
    }
  }
  
  // Check for partial matches (e.g., "dramatic" partially matches "drama")
  for (const word of words) {
    if (word.length >= 4 && target.length >= 4) {
      // Check if first 4 letters match
      if (word.substring(0, 4) === target.substring(0, 4)) {
        return 0.6;
      }
      
      // Check for similar root
      const shortestLength = Math.min(word.length, target.length);
      let matchingChars = 0;
      for (let i = 0; i < shortestLength; i++) {
        if (word[i] === target[i]) {
          matchingChars++;
        } else {
          break; // Stop at first mismatch
        }
      }
      
      if (matchingChars >= 3) {
        return 0.3 + (0.1 * matchingChars); // Incremental boost for more matching chars
      }
    }
  }
  
  return 0; // No match
}

/**
 * Apply extracted metadata to the track object
 * Only fills in fields that are empty
 */
export const applyExtractedMetadata = (track: any, extractedData: ExtractedMetadata): any => {
  const updated = { ...track }
  
  // Only update if the field is undefined or null
  if (extractedData.bpm && (updated.bpm === undefined || updated.bpm === null)) {
    updated.bpm = extractedData.bpm
  }
  
  if (extractedData.key && (updated.musicalKey === undefined || updated.musicalKey === null)) {
    updated.musicalKey = extractedData.key
  }
  
  // Optional metadata, only update if available and empty
  if (extractedData.mood && (updated.mood === undefined || updated.mood === null || updated.mood === '')) {
    updated.mood = extractedData.mood
  }
  
  if (extractedData.genre && (updated.genre === undefined || updated.genre === null || updated.genre === '')) {
    updated.genre = extractedData.genre
  }
  
  return updated
}

/**
 * Helper function to evaluate confidence in extracted metadata
 */
export const getMetadataConfidence = (metadata: ExtractedMetadata): Record<string, number> => {
  const confidence: Record<string, number> = {}
  
  // BPM confidence (60-100%)
  if (metadata.bpm) {
    if (metadata.bpm >= 70 && metadata.bpm <= 180) {
      confidence.bpm = 90 // Most common BPM range
    } else if (metadata.bpm >= 60 && metadata.bpm <= 200) {
      confidence.bpm = 70 // Less common but possible
    } else {
      confidence.bpm = 60 // Unusual BPM
    }
  }
  
  // Key confidence (70-90%)
  if (metadata.key) {
    // Major and minor keys of C, G, D, A, E, F are most common
    const commonKeys = ['C', 'G', 'D', 'A', 'E', 'F', 'Cm', 'Gm', 'Dm', 'Am', 'Em', 'Fm']
    if (commonKeys.includes(metadata.key)) {
      confidence.key = 90
    } else {
      confidence.key = 70
    }
  }
  
  // Mood confidence (fixed at 60%)
  if (metadata.mood) {
    // For exact matches, higher confidence
    const exactMatch = AVAILABLE_MOODS.some(mood => 
      new RegExp(`\\b${mood}\\b`, 'i').test(metadata.mood || '')
    );
    
    confidence.mood = exactMatch ? 80 : 60 // Mood is more subjective
  }
  
  // Genre confidence (fixed at 70%)
  if (metadata.genre) {
    // For exact matches with known genres, higher confidence
    const exactMatch = GENRE_KEYWORDS.some(genre => 
      genre.toLowerCase() === metadata.genre?.toLowerCase()
    );
    
    confidence.genre = exactMatch ? 85 : 70
  }
  
  return confidence
}

// Export mood and genre lists for use in other components
export const getAvailableMoods = () => AVAILABLE_MOODS;
export const getAvailableGenres = () => GENRE_KEYWORDS; 