import Image from 'next/image'

interface PlatformLinkProps {
  name: string
  logo: string
  url: string | null
  invertColors?: boolean
}

export default function PlatformLink({ 
  name, 
  logo, 
  url,
  invertColors = false 
}: PlatformLinkProps) {
  if (!url) {
    return (
      <div 
        className="flex flex-col items-center opacity-50 cursor-not-allowed"
        role="presentation"
        aria-label={`${name} - Coming Soon`}
      >
        <div className="h-10 w-auto relative">
          <Image
            src={logo}
            alt={`${name} logo`}
            width={40}
            height={40}
            className={`object-contain ${invertColors ? 'brightness-0 invert' : ''}`}
          />
        </div>
        <span className="text-xs text-gray-400 mt-2">Coming Soon</span>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-2"
      aria-label={`Listen to our music on ${name}`}
    >
      <div className="h-10 w-auto relative">
        <Image
          src={logo}
          alt={`${name} logo`}
          width={40}
          height={40}
          className={`object-contain ${invertColors ? 'brightness-0 invert' : ''}`}
        />
      </div>
      <span className="text-xs text-gray-400 mt-2">{name}</span>
    </a>
  )
} 