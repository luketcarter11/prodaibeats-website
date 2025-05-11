'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, type Profile } from '../../lib/supabase'
import { FaDownload, FaFileAlt } from 'react-icons/fa'
import { licenses } from '../../lib/licenses'

interface Order {
  id: string
  user_id: string
  track_name: string
  license: string
  order_date: string
  license_file: string | null
  total_amount: number
  currency: string
  status: string
}

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingLicenses, setGeneratingLicenses] = useState(false)
  const [generatingLicenseForOrder, setGeneratingLicenseForOrder] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const generateMissingLicenses = async (ordersWithoutLicenses: Order[]) => {
    console.log('Starting license generation for orders:', ordersWithoutLicenses)
    setGeneratingLicenses(true)
    try {
      // Get the session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Failed to get session:', sessionError)
        return
      }

      console.log('Got session for user:', session.user.id)

      for (const order of ordersWithoutLicenses) {
        console.log(`Generating license for order ${order.id}:`, {
          orderId: order.id,
          userId: order.user_id,
          sessionUserId: session.user.id
        })

        // Call our license generation API
        const response = await fetch('/api/generate-license', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
            orderId: order.id,
            trackTitle: order.track_name,
            licenseType: order.license,
          }),
        })

        const responseText = await response.text()
        console.log(`License generation response for order ${order.id}:`, {
          status: response.status,
          ok: response.ok,
          response: responseText,
          requestBody: {
            orderId: order.id,
            trackTitle: order.track_name,
            licenseType: order.license,
          }
        })

        if (!response.ok) {
          console.error(`Failed to generate license for order ${order.id}:`, responseText)
          continue
        }

        let result
        try {
          result = JSON.parse(responseText)
      } catch (err) {
          console.error('Failed to parse response JSON:', err)
          continue
        }
        
        console.log(`Successfully generated license for order ${order.id}:`, result)
        
        // Update the local state with the new license file
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o.id === order.id 
              ? { ...o, license_file: result.fileName }
              : o
          )
        )
      }
      } catch (err) {
      console.error('Error generating licenses:', err)
    } finally {
      setGeneratingLicenses(false)
    }
  }

  const handleManualGenerateLicense = async (order: Order) => {
    setGeneratingLicenseForOrder(order.id)
    setGenerationError(null)
    try {
      console.log(`Manually generating license for order ${order.id}`)
      
      // Call the license generation API directly without authentication
      const response = await fetch('/api/generate-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          trackTitle: order.track_name,
          licenseType: order.license,
        }),
      })

      const responseText = await response.text()
      console.log(`License generation response:`, {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${responseText}`)
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch (err) {
        throw new Error('Failed to parse response: ' + responseText)
      }
      
      // Update the local state with the new license file
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id 
            ? { ...o, license_file: result.fileName }
            : o
        )
      )

      console.log('License generated successfully:', result)
    } catch (err) {
      console.error('Error generating license:', err)
      setGenerationError(err instanceof Error ? err.message : String(err))
    } finally {
      setGeneratingLicenseForOrder(null)
    }
  }

  useEffect(() => {
    const fetchProfileAndOrders = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/auth/signin')
          return
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
          .eq('id', user.id)
        .single()

        if (profileError) {
          throw profileError
        }

        // Get user's orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('order_date', { ascending: false })

        if (ordersError) {
          throw ordersError
        }

        console.log('Fetched orders:', ordersData)

        setProfile(profileData)
        setOrders(ordersData || [])

        // Check for orders without licenses and generate them
        const ordersWithoutLicenses = (ordersData || []).filter(order => {
          const needsLicense = order.status === 'completed' && !order.license_file
          console.log(`Order ${order.id} needs license:`, needsLicense, {
            status: order.status,
            license_file: order.license_file
          })
          return needsLicense
        })

        console.log('Orders without licenses:', ordersWithoutLicenses)

        if (ordersWithoutLicenses.length > 0) {
          await generateMissingLicenses(ordersWithoutLicenses)
        }
    } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileAndOrders()
  }, [router])

  const handleDownload = async (orderId: string) => {
    try {
      const response = await fetch(`/api/download/${orderId}`)
      if (!response.ok) throw new Error('Failed to download file')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'track.wav' // The actual filename will be set by the server
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download file. Please try again.')
    }
  }

  const handleViewLicense = async (orderId: string, licenseFile: string | null) => {
    try {
      if (!licenseFile) {
        throw new Error('No license file available')
      }

      // Get the signed URL for the license file from Supabase storage
      const { data, error: urlError } = await supabase
        .storage
        .from('licenses')
        .createSignedUrl(licenseFile, 60) // URL valid for 60 seconds

      if (urlError || !data?.signedUrl) {
        throw new Error('Failed to get license file URL')
      }

      // Open the license in a new tab
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('License view error:', err)
      alert('Failed to view license. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }
      
  if (error) {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded">
            <p>No profile found. Please sign in again.</p>
        </div>
      </div>
      </div>
    )
  }

    return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-white">My Account</h1>
        
        <div className="space-y-8">
          {/* Profile Information */}
          <div className="bg-[#111111] rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                <p className="text-white">{profile.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <p className="text-white">{profile.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                <p className="text-white">{profile.phone || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Country</label>
                <p className="text-white">{profile.country || 'Not set'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Billing Address</label>
                <p className="text-white">{profile.billing_address || 'Not set'}</p>
              </div>
            </div>

            {/* Account Actions */}
            <div className="border-t border-zinc-800 pt-6 mt-6">
              <div className="space-x-4">
            <button
                  onClick={() => router.push('/account/edit')}
                  className="inline-block py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
                  Edit Profile
            </button>
              <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/')
                    router.refresh()
                  }}
                  className="inline-block py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
                >
                  Sign Out
              </button>
              </div>
            </div>
          </div>

          {/* Downloads Section */}
          <div className="bg-[#111111] rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">My Downloads</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">You haven't purchased any beats yet.</p>
                <Link 
                  href="/beats"
                  className="inline-block mt-4 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Browse Beats
                </Link>
          </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div 
                    key={order.id}
                    className="bg-zinc-900 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{order.track_name}</h3>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-400">
                          {order.license} License • {new Date(order.order_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-400">
                          {order.total_amount} {order.currency}
                        </p>
                        <p className="text-sm text-gray-400">
                          Order ID: {order.id.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-400">
                          Status: {order.status} • License File: {order.license_file ? 'Available' : 'Not available'}
                        </p>
                        {generationError && generatingLicenseForOrder === order.id && (
                          <p className="text-sm text-red-400">
                            Error: {generationError}
                          </p>
                        )}
        </div>
      </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                      <div className="flex gap-3 w-full">
                <button
                          onClick={() => handleDownload(order.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                          <FaDownload />
                          <span>Download</span>
                </button>
                  <button
                          onClick={() => handleViewLicense(order.id, order.license_file)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!order.license_file || generatingLicenses}
                          title={
                            generatingLicenses 
                              ? 'Generating license...' 
                              : order.license_file 
                                ? 'View License' 
                                : 'License not available'
                          }
                        >
                          <FaFileAlt />
                          <span>{generatingLicenses ? 'Generating...' : 'License'}</span>
                  </button>
                      </div>
                      {!order.license_file && (
                  <button
                          onClick={() => handleManualGenerateLicense(order)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-green-700 hover:bg-green-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={generatingLicenseForOrder === order.id}
                        >
                          <FaFileAlt />
                          <span>
                            {generatingLicenseForOrder === order.id 
                              ? 'Generating...' 
                              : 'Generate License'}
                          </span>
                  </button>
              )}
            </div>
                    </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
  )
} 