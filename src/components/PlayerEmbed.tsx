interface PlayerEmbedProps {
  trackId: string
  title: string
}

export default function PlayerEmbed({ trackId, title }: PlayerEmbedProps) {
  return (
    <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <iframe
        src={`https://open.spotify.com/embed/track/${trackId}`}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={title}
      />
    </div>
  )
} 