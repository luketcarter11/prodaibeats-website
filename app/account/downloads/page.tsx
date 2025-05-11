'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { FaDownload, FaFileAlt, FaSpinner } from 'react-icons/fa'

interface PurchasedTrack {
  id: string
  track_id: string
  track_name: string
  license: string
  order_date: string
  license_file?: string
  total_amount: number
  currency?: string
}

export default function DownloadsPage() {
  const [purchases, setPurchases] = useState<PurchasedTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        if (!user) {
          router.push('/login')
          return
        }

        // Get user's orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('order_date', { ascending: false })

        if (ordersError) throw ordersError

        setPurchases(orders)
      } catch (err) {
        console.error('Error fetching purchases:', err)
        setError('Failed to load your purchases. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchases()
  }, [router])

  const handleDownload = async (trackId: string) => {
    try {
      const response = await fetch(`/api/download/${trackId}`)
      if (!response.ok) throw new Error('Failed to get download URL')
      
      const { url } = await response.json()
      
      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', '')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download track. Please try again later.')
    }
  }

  const handleViewLicense = async (orderId: string) => {
    try {
      const response = await fetch(`/api/license/${orderId}`)
      if (!response.ok) throw new Error('Failed to get license')
      
      const { url } = await response.json()
      window.open(url, '_blank')
    } catch (err) {
      console.error('License view error:', err)
      setError('Failed to view license. Please try again later.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <FaSpinner className="animate-spin h-8 w-8 text-purple-500" />
          <span className="text-white">Loading your purchases...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Your Downloads</h1>

      {error && (
        <div className="mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {purchases.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/80 rounded-xl">
          <h2 className="text-xl font-medium text-white mb-2">No Purchases Yet</h2>
          <p className="text-gray-400 mb-6">
            You haven't purchased any beats yet. Check out our collection and find your next hit!
          </p>
          <button
            onClick={() => router.push('/beats')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Beats
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-zinc-900/80 rounded-xl overflow-hidden border border-white/10"
            >
              <div className="relative aspect-video">
                <Image
                  src={`${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}/covers/${purchase.track_id}.jpg`}
                  alt={purchase.track_name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{purchase.track_name}</h3>
                <div className="space-y-2 mb-6">
                  <p className="text-gray-400">
                    <span className="text-gray-500">License:</span> {purchase.license}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-500">Purchased:</span>{' '}
                    {new Date(purchase.order_date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-500">Amount:</span>{' '}
                    {purchase.currency 
                      ? new Intl.NumberFormat('en-US', { 
                          style: 'currency', 
                          currency: purchase.currency 
                        }).format(purchase.total_amount)
                      : `$${purchase.total_amount.toFixed(2)}`
                    }
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownload(purchase.track_id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FaDownload />
                    Download
                  </button>
                  <button
                    onClick={() => handleViewLicense(purchase.id)}
                    className="flex-1 flex items-center justify-center gap-2 border border-white/10 text-gray-300 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <FaFileAlt />
                    License
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 