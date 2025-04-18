interface SpotifyTrack {
  id: string
  name: string
  preview_url: string
  external_urls: {
    spotify: string
  }
}

export function getSpotifyEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}`
}

export function getSpotifyShareUrl(trackId: string): string {
  return `https://open.spotify.com/track/${trackId}`
}

export function parseSpotifyUrl(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export function formatSpotifyTrack(track: SpotifyTrack) {
  return {
    id: track.id,
    title: track.name,
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls.spotify,
  }
} 