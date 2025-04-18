interface AppleMusicTrack {
  id: string
  attributes: {
    name: string
    previews: {
      url: string
    }[]
    url: string
  }
}

export function getAppleMusicEmbedUrl(trackId: string): string {
  return `https://embed.music.apple.com/us/album/${trackId}`
}

export function getAppleMusicShareUrl(trackId: string): string {
  return `https://music.apple.com/us/album/${trackId}`
}

export function parseAppleMusicUrl(url: string): string | null {
  const match = url.match(/album\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export function formatAppleMusicTrack(track: AppleMusicTrack) {
  return {
    id: track.id,
    title: track.attributes.name,
    previewUrl: track.attributes.previews[0]?.url,
    appleMusicUrl: track.attributes.url,
  }
} 