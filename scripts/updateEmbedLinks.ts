import { parseSpotifyUrl } from '@/lib/spotify'
import { parseAppleMusicUrl } from '@/lib/apple'

interface Track {
  id: string
  spotifyUrl?: string
  appleMusicUrl?: string
}

// This would come from your database in a real app
const tracks: Track[] = [
  {
    id: '1',
    spotifyUrl: 'https://open.spotify.com/track/123456789',
    appleMusicUrl: 'https://music.apple.com/us/album/123456789',
  },
]

async function updateEmbedLinks() {
  try {
    console.log('Starting embed link update...')

    for (const track of tracks) {
      const updates: Partial<Track> = {}

      if (track.spotifyUrl) {
        const spotifyId = parseSpotifyUrl(track.spotifyUrl)
        if (spotifyId) {
          updates.spotifyUrl = spotifyId
          console.log(`Updated Spotify ID for track ${track.id}: ${spotifyId}`)
        }
      }

      if (track.appleMusicUrl) {
        const appleMusicId = parseAppleMusicUrl(track.appleMusicUrl)
        if (appleMusicId) {
          updates.appleMusicUrl = appleMusicId
          console.log(`Updated Apple Music ID for track ${track.id}: ${appleMusicId}`)
        }
      }

      // In a real app, you would update the database here
      console.log(`Track ${track.id} updates:`, updates)
    }

    console.log('Embed link update completed successfully')
  } catch (error) {
    console.error('Error updating embed links:', error)
    process.exit(1)
  }
}

// Run the update
updateEmbedLinks() 