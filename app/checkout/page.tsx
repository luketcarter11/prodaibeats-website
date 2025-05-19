'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { FaArrowLeft, FaSpinner } from 'react-icons/fa'
import { supabase } from '@/lib/supabaseClient'
import SignInPopup from '@/components/SignInPopup'
import SignUpPopup from '@/components/SignUpPopup'

const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// Fallback prices in USD for when price feed is unavailable
const FALLBACK_PRICES = {
  SOL: 171.37, // More accurate SOL price (as of May 2025)
  PROD: 0.00003 // PROD token price
} as const;

type CryptoType = keyof typeof FALLBACK_PRICES;

interface ErrorMessage {
  message: string;
  field?: string;
}

export default function CheckoutPage() {
  const { cart, cartTotal, isLoading: cartLoading } = useCart()
  const { user, session, isLoading: authLoading, refreshSession } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<ErrorMessage | null>(null)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const router = useRouter()

  // Check session status on component mount
  useEffect(() => {
    if (user && !session) {
      // User state exists but no session, try to refresh
      const attemptSessionRefresh = async () => {
        await refreshSession();
      };
      attemptSessionRefresh();
    }
  }, [user, session, refreshSession]);

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setIsSignInOpen(false)
    setIsSignUpOpen(false)
    setError(null)
  }

  // Handle checkout process
  const handleCheckout = useCallback(async () => {
    if (isRedirecting) return

    try {
      if (!user?.id || !user?.email) {
        setIsSignInOpen(true)
        return
      }

      setIsRedirecting(true)
      setError(null)

      console.log('Starting checkout process with user:', user.id);

      // Create transaction first
      const transactionData = await createTransaction()
      
      if (!transactionData?.id) {
        throw new Error('No transaction data returned')
      }

      console.log('Successfully created transaction:', transactionData.id);

      // Navigate immediately after transaction is created
      router.replace(`/crypto-payment?transaction=${transactionData.id}&method=direct`)
    } catch (error: any) {
      console.error('Checkout error:', error)
      setError({
        message: error.message || 'Failed to process checkout. Please try again.',
        field: 'checkout'
      })
      setIsRedirecting(false)
    }
  }, [isRedirecting, user, router])

  // Separate transaction creation logic
  const createTransaction = async () => {
    if (!user?.id || !user?.email) {
      throw new Error('User authentication required');
    }

    const cartItems = cart.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      licenseType: item.licenseType
    }))
    const firstItem = cartItems[0] || {}
    const metadata = { 
      items: cartItems,
      created_at: new Date().toISOString(),
      client_info: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      }
    }

    try {
      // Calculate the crypto amount correctly
      const solAmount = cartTotal / FALLBACK_PRICES['SOL'];
      
      console.log('Cart total amount in USD:', cartTotal);
      console.log('SOL price used for conversion:', FALLBACK_PRICES['SOL']);
      console.log('Calculated SOL amount:', solAmount);
      
      console.log('Attempting to create transaction with data:', {
        user_id: user.id,
        usd_amount: cartTotal,
        crypto_type: 'SOL',
        crypto_amount: solAmount,
        metadata,
        customer_email: user.email,
        license_type: firstItem.licenseType || null
      });

      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'create_crypto_transaction',
        {
          p_user_id: user.id,
          p_usd_amount: cartTotal,
          p_crypto_type: 'SOL',
          p_crypto_amount: solAmount,
          p_metadata: metadata,
          p_customer_email: user.email,
          p_license_type: firstItem.licenseType || null
        }
      )

      console.log('RPC Response:', { rpcData, rpcError });

      // If the RPC call is successful and returns data
      if (!rpcError && rpcData) {
        console.log('Using RPC data:', rpcData);
        
        // Verify the transaction exists by attempting to read it back
        try {
          const { data: verifyData, error: verifyError } = await supabase
            .from('transactions')
            .select('id')
            .eq('id', rpcData.id)
            .maybeSingle();
            
          if (verifyError || !verifyData) {
            console.warn('Could not verify transaction creation, continuing anyway:', verifyError);
          } else {
            console.log('Transaction verified in database:', verifyData.id);
          }
        } catch (verifyError) {
          console.warn('Error verifying transaction, continuing anyway:', verifyError);
        }
        
        // Store transaction in localStorage to help with recovery
        if (typeof window !== 'undefined' && rpcData.id) {
          const storageKey = 'last_created_transaction';
          const transactionInfo = {
            id: rpcData.id,
            created_at: new Date().toISOString(),
            amount: cartTotal,
            method: 'crypto'
          };
          
          try {
            localStorage.setItem(storageKey, JSON.stringify(transactionInfo));
            console.log(`Saved transaction ${rpcData.id} to localStorage for recovery`);
          } catch (storageError) {
            console.warn('Failed to save transaction to localStorage:', storageError);
          }
        }
        
        return rpcData;
      }
      
      // If we get here, either there was an error or no data was returned
      // Try the direct insert approach as a fallback
      console.log('RPC call failed, trying direct insert as fallback');
      
      // Create enhanced metadata with original USD amount
      const enhancedMetadata = {
        ...metadata,
        original_usd_amount: cartTotal,
        crypto: {
          type: 'SOL',
          expected_amount: solAmount,
          selected_at: new Date().toISOString()
        },
        fallback_method: 'direct_insert'
      };
      
      console.log('Enhanced metadata for direct insert:', enhancedMetadata);
      
      const { data: insertData, error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: cartTotal, // Store the original USD amount
          currency: 'USD',   // Store as USD
          status: 'awaiting_payment',
          transaction_type: 'crypto_purchase',
          payment_method: 'crypto_sol',
          customer_email: user.email,
          license_type: firstItem.licenseType || null,
          metadata: enhancedMetadata
        })
        .select()
        .single();

      if (insertError) {
        console.error('Direct insert error:', insertError);
        
        // Try one more time without .single() which sometimes causes issues
        const { data: insertDataNoSingle, error: insertErrorNoSingle } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            amount: cartTotal,
            currency: 'USD',
            status: 'awaiting_payment',
            transaction_type: 'crypto_purchase',
            payment_method: 'crypto_sol',
            customer_email: user.email,
            license_type: firstItem.licenseType || null,
            metadata: {
              ...enhancedMetadata,
              fallback_method: 'direct_insert_no_single'
            }
          })
          .select();
          
        if (insertErrorNoSingle || !insertDataNoSingle || insertDataNoSingle.length === 0) {
          throw new Error('Failed to create transaction via direct insert');
        }
        
        console.log('Using direct insert (no single) data:', insertDataNoSingle[0]);
        
        // Store transaction in localStorage to help with recovery
        if (typeof window !== 'undefined' && insertDataNoSingle[0]?.id) {
          const storageKey = 'last_created_transaction';
          const transactionInfo = {
            id: insertDataNoSingle[0].id,
            created_at: new Date().toISOString(),
            amount: cartTotal,
            method: 'crypto'
          };
          
          try {
            localStorage.setItem(storageKey, JSON.stringify(transactionInfo));
            console.log(`Saved transaction ${insertDataNoSingle[0].id} to localStorage for recovery`);
          } catch (storageError) {
            console.warn('Failed to save transaction to localStorage:', storageError);
          }
        }
        
        return insertDataNoSingle[0];
      }

      console.log('Using direct insert data:', insertData);
      
      // Store transaction in localStorage to help with recovery
      if (typeof window !== 'undefined' && insertData?.id) {
        const storageKey = 'last_created_transaction';
        const transactionInfo = {
          id: insertData.id,
          created_at: new Date().toISOString(),
          amount: cartTotal,
          method: 'crypto'
        };
        
        try {
          localStorage.setItem(storageKey, JSON.stringify(transactionInfo));
          console.log(`Saved transaction ${insertData.id} to localStorage for recovery`);
        } catch (storageError) {
          console.warn('Failed to save transaction to localStorage:', storageError);
        }
      }
      
      return insertData;
      
    } catch (error) {
      console.error('Transaction creation error:', error);
      throw new Error('Failed to create transaction. Please try again.');
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      setIsRedirecting(false)
      setError(null)
    }
  }, [])

  // Loading state
  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin h-8 w-8 text-purple-500" />
      </div>
    )
  }

  // Empty cart redirect
  if (!cart || cart.length === 0) {
    router.push('/beats')
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {/* Back to Cart Link */}
      <Link 
        href="/cart" 
        className="inline-flex items-center text-gray-400 hover:text-white mb-8"
      >
        <FaArrowLeft className="mr-2" />
        Back to Cart
      </Link>

      <div className="space-y-8">
        {/* Order Summary */}
        <section className="bg-zinc-900/80 rounded-xl p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Order Summary</h1>
          
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-start space-x-4">
                <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                  <Image
                    src={item.coverUrl || `${CDN}/covers/${item.id}.jpg`}
                    alt={item.title || 'Track'}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-white font-medium">{item.title}</h3>
                    <p className="text-white">${item.price?.toFixed(2)}</p>
                  </div>
                  <p className="text-gray-400 text-sm">{item.licenseType} License</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex justify-between text-white text-xl font-bold">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Payment Section */}
        <section className="bg-zinc-900/80 rounded-xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Payment</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-white">{error.message}</p>
            </div>
          )}

          {!user ? (
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-2">Sign In Required</h3>
              <p className="text-gray-300 text-sm mb-4">
                Please sign in or create an account to complete your purchase.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsSignUpOpen(true)}
                  className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  Signed in as <span className="text-white">{user.email}</span>
                </p>
                {!session && (
                  <p className="text-amber-400 text-xs mt-1">
                    Session expired. Click Pay to refresh.
                  </p>
                )}
              </div>

              <button
                onClick={handleCheckout}
                disabled={isRedirecting}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isRedirecting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Pay with Crypto'
                )}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Auth Popups */}
      <SignInPopup 
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSuccess={handleAuthSuccess}
      />
      <SignUpPopup
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
} 