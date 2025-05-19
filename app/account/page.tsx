'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, type Profile } from '../../lib/supabase'
import { FaDownload, FaFileAlt } from 'react-icons/fa'
import { licenses } from '../../lib/licenses'
import { Transaction } from '../../lib/getOrders'
import AuthModal from '../../src/components/auth/AuthModal'

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [generatingLicenses, setGeneratingLicenses] = useState(false)
  const [generatingLicenseForTransaction, setGeneratingLicenseForTransaction] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const generateMissingLicenses = async (transactionsWithoutLicenses: Transaction[]) => {
    console.log('Starting license generation for transactions:', transactionsWithoutLicenses)
    setGeneratingLicenses(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Failed to get session:', sessionError)
        return
      }

      console.log('Got session for user:', session.user.id)

      for (const transaction of transactionsWithoutLicenses) {
        const trackTitle = transaction.metadata?.items?.[0]?.title || transaction.metadata?.track_name;
        
        if (!trackTitle || !transaction.license_type) {
          console.log(`Skipping transaction ${transaction.id} - missing track name or license type`)
          continue
        }

        console.log(`Generating license for transaction ${transaction.id}:`, {
          transactionId: transaction.id,
          userId: transaction.user_id,
          sessionUserId: session.user.id
        })

        const response = await fetch('/api/generate-license', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            transactionId: transaction.id,
            trackTitle: trackTitle,
            licenseType: transaction.license_type,
          }),
        })

        const responseText = await response.text()
        console.log(`License generation response for transaction ${transaction.id}:`, {
          status: response.status,
          ok: response.ok,
          response: responseText,
          requestBody: {
            transactionId: transaction.id,
            trackTitle: trackTitle,
            licenseType: transaction.license_type,
          }
        })

        if (!response.ok) {
          console.error(`Failed to generate license for transaction ${transaction.id}:`, responseText)
          continue
        }

        let result
        try {
          result = JSON.parse(responseText)
        } catch (err) {
          console.error('Failed to parse response JSON:', err)
          continue
        }
        
        console.log(`Successfully generated license for transaction ${transaction.id}:`, result)
        
        // Update the local state with the new license file
        setTransactions(prevTransactions => 
          prevTransactions.map(t => 
            t.id === transaction.id 
              ? { ...t, metadata: { ...t.metadata, license_file: result.fileName } }
              : t
          )
        )
      }
    } catch (err) {
      console.error('Error generating licenses:', err)
    } finally {
      setGeneratingLicenses(false)
    }
  }

  const handleManualGenerateLicense = async (transaction: Transaction) => {
    const trackTitle = transaction.metadata?.items?.[0]?.title || transaction.metadata?.track_name;
    
    if (!trackTitle || !transaction.license_type) {
      setGenerationError('Missing track name or license type')
      return
    }

    setGeneratingLicenseForTransaction(transaction.id)
    setGenerationError(null)
    try {
      console.log(`Manually generating license for transaction ${transaction.id}`)
      
      const response = await fetch('/api/generate-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          trackTitle: trackTitle,
          licenseType: transaction.license_type,
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
      setTransactions(prevTransactions => 
        prevTransactions.map(t => 
          t.id === transaction.id 
            ? { ...t, metadata: { ...t.metadata, license_file: result.fileName } }
            : t
        )
      )

      console.log('License generated successfully:', result)
    } catch (err) {
      console.error('Error generating license:', err)
      setGenerationError(err instanceof Error ? err.message : String(err))
    } finally {
      setGeneratingLicenseForTransaction(null)
    }
  }

  useEffect(() => {
    const fetchProfileAndTransactions = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          setShowAuthModal(true)
          return
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Profile not found
            setShowAuthModal(true)
            await supabase.auth.signOut() // Sign out since profile is missing
            return
          }
          throw profileError
        }

        if (!profileData) {
          setShowAuthModal(true)
          await supabase.auth.signOut() // Sign out since profile is missing
          return
        }

        // Get user's transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .in('transaction_type', ['payment', 'crypto_purchase'])
          .in('status', ['completed'])
          .order('created_at', { ascending: false })

        if (transactionsError) {
          throw transactionsError
        }

        setProfile(profileData)
        setTransactions(transactionsData || [])

        // Check for transactions without licenses and generate them
        const transactionsWithoutLicenses = (transactionsData || []).filter(transaction => {
          const hasTrackName = transaction.metadata?.track_name || transaction.metadata?.items?.[0]?.title;
          const needsLicense = transaction.status === 'completed' && 
            !transaction.metadata?.license_file && 
            transaction.license_type && 
            hasTrackName;
          return needsLicense
        })

        if (transactionsWithoutLicenses.length > 0) {
          await generateMissingLicenses(transactionsWithoutLicenses)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profile')
        setShowAuthModal(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileAndTransactions()
  }, [router])

  const handleDownload = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/download/${transactionId}`)
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

  const handleViewLicense = async (transactionId: string, licenseFile: string | null) => {
    try {
      if (!licenseFile) {
        throw new Error('No license file available')
      }

      const { data, error: urlError } = await supabase
        .storage
        .from('licenses')
        .createSignedUrl(licenseFile, 60)

      if (urlError || !data?.signedUrl) {
        throw new Error('Failed to get license file URL')
      }

      window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('License view error:', err)
      alert('Failed to view license. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your account...</p>
        </div>
      </div>
    )
  }

  if (showAuthModal) {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => router.push('/')}
        defaultView="sign-in"
        initialError={error}
      />
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
            
            {transactions.length === 0 ? (
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
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="bg-zinc-900 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{transaction.metadata?.items?.[0]?.title || transaction.metadata?.track_name || 'Unknown Track'}</h3>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-400">
                          {transaction.license_type || transaction.metadata?.items?.[0]?.licenseType || 'Standard'} License • {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-400">
                          {transaction.currency === 'USD' 
                            ? `$${transaction.amount.toFixed(2)}` 
                            : `${parseFloat(transaction.amount.toFixed(3))} ${transaction.currency}`}
                        </p>
                        <p className="text-sm text-gray-400">
                          Transaction ID: {transaction.id.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-400">
                          Status: {transaction.status} • License File: {transaction.metadata?.license_file ? 'Available' : 'Not available'}
                        </p>
                        {generationError && generatingLicenseForTransaction === transaction.id && (
                          <p className="text-sm text-red-400">
                            Error: {generationError}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => handleDownload(transaction.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                        >
                          <FaDownload />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => handleViewLicense(transaction.id, transaction.metadata?.license_file || null)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!transaction.metadata?.license_file || generatingLicenses}
                          title={
                            generatingLicenses 
                              ? 'Generating license...' 
                              : transaction.metadata?.license_file 
                                ? 'View License' 
                                : 'License not available'
                          }
                        >
                          <FaFileAlt />
                          <span>{generatingLicenses ? 'Generating...' : 'License'}</span>
                        </button>
                      </div>
                      {!transaction.metadata?.license_file && transaction.license_type && (
                        <button
                          onClick={() => handleManualGenerateLicense(transaction)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-green-700 hover:bg-green-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={generatingLicenseForTransaction === transaction.id}
                        >
                          <FaFileAlt />
                          <span>
                            {generatingLicenseForTransaction === transaction.id 
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