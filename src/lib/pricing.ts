export const LICENSE_PRICE = 29.99

export const LICENSE_TYPES = {
  STANDARD: {
    name: 'Standard License',
    price: LICENSE_PRICE,
    features: [
      'Commercial use',
      'Unlimited projects',
      'High-quality WAV file',
      'PDF license agreement',
    ],
  },
  PREMIUM: {
    name: 'Premium License',
    price: LICENSE_PRICE * 2,
    features: [
      'All Standard features',
      'Exclusive rights',
      'Source files',
      'Priority support',
    ],
  },
} as const

export const CURRENCY = 'USD'

export const TAX_RATE = 0.1 // 10% tax rate 