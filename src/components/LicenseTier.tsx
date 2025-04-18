import { LicenseTier as LicenseTierType } from '@/lib/data'

interface LicenseTierProps {
  tier: LicenseTierType
  featured?: boolean
  onSelect?: (tier: LicenseTierType) => void
}

export default function LicenseTier({ 
  tier, 
  featured = false,
  onSelect 
}: LicenseTierProps) {
  const handleSelect = () => {
    onSelect?.(tier)
  }

  return (
    <div 
      className={`rounded-lg p-6 ${
        featured 
          ? 'bg-rose-600 text-white border-2 border-rose-500' 
          : 'bg-black text-white border border-gray-800'
      }`}
      role="article"
      aria-label={`${tier.name} license tier`}
    >
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
        <div className="text-3xl font-bold mb-1">${tier.price}</div>
        <div className={`text-sm ${featured ? 'text-rose-200' : 'text-gray-400'}`}>
          {tier.streams} streams
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${featured ? 'text-rose-200' : 'text-gray-400'}`}>
            Distribution Rights
          </h4>
          <ul 
            className="space-y-2"
            role="list"
            aria-label="Distribution rights"
          >
            {tier.distribution.map((right, index) => (
              <li 
                key={index} 
                className="flex items-center text-sm"
                role="listitem"
              >
                <svg 
                  className="w-4 h-4 mr-2 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                {right}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${featured ? 'text-rose-200' : 'text-gray-400'}`}>
            Features
          </h4>
          <ul 
            className="space-y-2"
            role="list"
            aria-label="License features"
          >
            {tier.features.map((feature, index) => (
              <li 
                key={index} 
                className="flex items-center text-sm"
                role="listitem"
              >
                <svg 
                  className="w-4 h-4 mr-2 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <button 
        onClick={handleSelect}
        onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
        className={`w-full mt-6 py-2 px-4 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 ${
          featured
            ? 'bg-white text-rose-600 hover:bg-rose-50'
            : 'bg-rose-600 text-white hover:bg-rose-700'
        }`}
        aria-label={`Select ${tier.name} license for $${tier.price}`}
        tabIndex={0}
      >
        Choose {tier.name}
      </button>
    </div>
  )
} 