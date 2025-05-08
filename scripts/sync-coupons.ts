import fetch from 'node-fetch'

interface SyncResponse {
  success: boolean
  message?: string
  error?: string
  results?: {
    created: number
    updated: number
    deleted: number
    errors: number
  }
}

async function syncCoupons() {
  try {
    console.log('Starting coupon sync...')
    
    const response = await fetch('http://localhost:3000/api/admin/sync-discount-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json() as SyncResponse
    console.log('Sync response:', data)

    if (!response.ok) {
      throw new Error(`Failed to sync coupons: ${data.error}`)
    }

    console.log('Sync completed successfully!')
    console.log('Results:', data.results)
  } catch (error) {
    console.error('Error running sync:', error)
    process.exit(1)
  }
}

syncCoupons() 