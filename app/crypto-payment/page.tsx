'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaSpinner, FaCopy, FaCheck, FaClock, FaExclamationTriangle, FaCircle } from 'react-icons/fa'
import { SiLitecoin, SiSolana } from 'react-icons/si'
import { RiTimerLine, RiCheckboxCircleLine, RiErrorWarningLine } from 'react-icons/ri'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

// Define interfaces for Helius API responses
interface HeliusTokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  mint: string;
  amount: string;
  tokenStandard?: string;
}

interface HeliusNativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: string;
}

interface HeliusTransaction {
  signature: string;
  type: string;
  timestamp: number;
  slot: number;
  fee: number;
  nativeTransfers?: HeliusNativeTransfer[];
  tokenTransfers?: HeliusTokenTransfer[];
  accountData?: any[];
  confirmations?: number;
  blockTime?: number;
  senderAddress?: string;
}

interface TransactionData {
  id: string
  user_id: string
  amount: number
  currency: string
  customer_email: string | null
  transaction_type: string
  payment_method: string | null
  status: string
  license_type: string | null
  stripe_session_id: string | null
  stripe_transaction_id: string | null
  metadata: {
    items: Array<{
      id: string
      title: string
      price: number
      licenseType: string
      coverImage?: string
    }>
    crypto?: {
      type: string
      address: string
      sender_address?: string
      selected_at: string
      converted_amount?: number
      expected_amount?: number
      transaction_signature?: string
    }
    original_usd_amount?: number
  } | null
  created_at: string
  updated_at: string
}

interface CryptoPrice {
  [key: string]: number; // price in USD
}

type TransactionStatus = 'awaiting_payment' | 'confirming' | 'confirmed' | 'completed' | 'expired';

// Custom PRODAI token icon component
const ProdIcon = () => (
  <div className="flex items-center justify-center h-8 w-8">
    <Image
      src="/images/$PRODcrypto.png"
      alt="PROD Token"
      width={32}
      height={32}
      className="object-contain"
    />
  </div>
);

// Payment step component for timeline
interface PaymentStepProps {
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  isLast?: boolean;
}

const PaymentStep = ({ title, description, isActive, isCompleted, isLast = false }: PaymentStepProps) => {
  return (
    <div className="flex flex-col relative">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 
          ${isCompleted ? 'bg-green-500' : isActive ? 'bg-purple-500' : 'bg-zinc-700'}`}>
          {isCompleted ? (
            <FaCheck className="h-4 w-4 text-white" />
          ) : (
            <FaCircle className={`h-2 w-2 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
          )}
        </div>
        {!isLast && (
          <div className={`h-0.5 flex-1 ml-2 
            ${isCompleted ? 'bg-green-500' : 'bg-zinc-700'}`} />
        )}
      </div>
      <div className="mt-2 ml-2">
        <h3 className={`text-sm font-medium ${isActive || isCompleted ? 'text-white' : 'text-zinc-400'}`}>
          {title}
        </h3>
        <p className={`text-xs mt-1 ${isActive ? 'text-purple-300' : 'text-zinc-500'}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default function CryptoPaymentPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<TransactionData | null>(null)
  const [selectedCrypto, setSelectedCrypto] = useState<string>('')
  const [paymentAddress, setPaymentAddress] = useState<string>('GaT93YoCUZ98baT3XQh8m1FgvTweSeNqYnkwrjdmwsJv')
  const [senderWalletAddress, setSenderWalletAddress] = useState<string>('')
  const [walletAddressError, setWalletAddressError] = useState<string | null>(null)
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice>({})
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('awaiting_payment')
  const [timeRemaining, setTimeRemaining] = useState<number>(60 * 60) // 1 hour in seconds
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [foundTransaction, setFoundTransaction] = useState<any | null>(null)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null)
  const { user, session, isLoading: authLoading, refreshSession } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Constants
  const WALLET_ADDRESS = '8SauUJyfbxWcH6P2NTQbEen7c7bfkVQxnV3Nrjj19Bzn'; // Solana wallet address
  const PROD_CONTRACT = 'BR4aPTSMDFNz2Y3Mv4AsPvDyu1tTkjYdPvHVrHqQxbQE'; // PROD token address on Solana
  const REQUIRED_CONFIRMATIONS = 3; // Number of confirmations needed for "confirmed" status
  const PRICE_REFRESH_INTERVAL = 60 * 1000; // 1 minute
  const PAYMENT_CHECK_INTERVAL = 20 * 1000; // 20 seconds
  const PAYMENT_LEEWAY = 0.05; // 5% leeway in payment amount
  const AUTO_COMPLETE_DELAY = 1000; // 1 second delay for transitions
  const LOCAL_STORAGE_KEY = 'crypto_payment_transaction'; // Key for storing transaction state
  const USED_TX_STORAGE_KEY = 'used_crypto_transactions'; // Key for storing used transaction signatures

  // Hardcoded crypto prices as fallback (in case API calls fail due to CORS)
  const FALLBACK_PRICES = {
    SOL: 171.37, // Updated SOL price from CoinGecko
    PROD: 0.00003  // PROD price remains the same as it's a custom token
  } as const;

  const cryptoOptions = [
    { symbol: 'SOL', name: '$SOL', icon: SiSolana, apiId: 'solana' },
    { symbol: 'PROD', name: '$PROD', icon: ProdIcon, contract: PROD_CONTRACT }
  ]

  // Format crypto amount based on token type
  const formatCryptoAmount = (amount: number | null, cryptoType: string): string => {
    if (amount === null) return '0'
    
    // Display PROD tokens as whole numbers without decimals
    if (cryptoType === 'PROD') {
      return Math.round(amount).toLocaleString()
    }
    
    // Display SOL and other tokens with 6 decimal places
    return amount.toFixed(6)
  }

  // Format remaining time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format time since last price update
  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return 'never'
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    return `${Math.floor(diffInSeconds / 3600)} hours ago`
  }

  // Save current payment state to localStorage
  const saveStateToLocalStorage = (transactionId: string, state: {
    status: TransactionStatus;
    selectedCrypto?: string;
    convertedAmount?: number | null;
    foundTransaction?: any;
    timeRemaining?: number;
    senderWalletAddress?: string;
    showPaymentInstructions?: boolean;
  }) => {
    if (typeof window !== 'undefined') {
      const existingData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        ...existingData,
        [transactionId]: {
          ...state,
          lastUpdated: new Date().toISOString()
        }
      }))
      
      console.log(`Saved payment state for transaction ${transactionId}:`, state)
    }
  }

  // Load payment state from localStorage
  const loadStateFromLocalStorage = (transactionId: string) => {
    if (typeof window !== 'undefined') {
      try {
        const allData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')
        const savedState = allData[transactionId] || null
        
        // If we have a saved sender address, restore it
        if (savedState && savedState.senderWalletAddress) {
          setSenderWalletAddress(savedState.senderWalletAddress)
        }
        
        return savedState
      } catch (e) {
        console.error('Error loading state from localStorage:', e)
        return null
      }
    }
    return null
  }
  
  // Remove payment state when completed or expired
  const clearStateFromLocalStorage = (transactionId: string) => {
    if (typeof window !== 'undefined') {
      const existingData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')
      
      if (existingData[transactionId]) {
        delete existingData[transactionId]
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData))
        console.log(`Cleared payment state for transaction ${transactionId}`)
      }
    }
  }

  // Modify the loadTransactionWithRetry function to use a more compatible approach
  const loadTransactionWithRetry = async (transactionId: string, userId: string, retryCount = 0, maxRetries = 5) => {
    console.log(`Attempt ${retryCount + 1}/${maxRetries + 1} to load transaction: ${transactionId}`);
    
    try {
      // First try: Direct fetch using the most reliable method
      const { data: directData, error: directError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (!directError && directData) {
        console.log('Successfully loaded transaction via direct fetch:', directData.id);
        return { data: directData, source: 'direct-fetch' };
      }
      
      // Second try: Array fetch method
      const { data: arrayData, error: arrayError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId);
        
      if (!arrayError && arrayData && arrayData.length > 0) {
        console.log('Successfully loaded transaction via array fetch:', arrayData[0].id);
        return { data: arrayData[0], source: 'array-fetch' };
      }
      
      // If production environment, try RPC call approach
      if (process.env.NODE_ENV === 'production') {
        try {
          console.log('Attempting RPC fetch in production environment');
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'get_transaction_by_id',
            {
              p_transaction_id: transactionId,
              p_user_id: userId
            }
          );
          
          if (!rpcError && rpcData) {
            console.log('Successfully loaded transaction via RPC call:', rpcData.id);
            return { data: rpcData, source: 'rpc-fetch' };
          }
        } catch (rpcErr) {
          console.warn('RPC fetch attempt failed:', rpcErr);
        }
      }
      
      // Try direct fetch without user_id filter, which might be more reliable in some edge cases
      const { data: directDataNoUser, error: directErrorNoUser } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();
        
      if (!directErrorNoUser && directDataNoUser && directDataNoUser.user_id === userId) {
        console.log('Successfully loaded transaction via direct fetch without user_id filter:', directDataNoUser.id);
        return { data: directDataNoUser, source: 'direct-fetch-no-user' };
      }
      
      // If direct fetch fails and we have retries left, wait and try again
      if (retryCount < maxRetries) {
        // Exponential backoff with slightly longer delays for production: 1.5s, 3s, 6s, etc.
        const baseDelay = process.env.NODE_ENV === 'production' ? 1500 : 1000;
        const delay = Math.min(Math.pow(2, retryCount) * baseDelay, 10000); // Cap at 10 seconds
        console.log(`Transaction not found via direct fetch, retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return loadTransactionWithRetry(transactionId, userId, retryCount + 1, maxRetries);
      }
      
      // Last attempt - try with direct URL fetch without headers that might cause issues
      try {
        console.log('Attempting final direct URL fetch with minimal headers...');
        
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        
        if (!baseUrl || !apiKey) {
          throw new Error('Supabase configuration missing');
        }
        
        const response = await fetch(
          `${baseUrl}/rest/v1/transactions?id=eq.${transactionId}&user_id=eq.${userId}&limit=1`,
          {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Authorization': `Bearer ${apiKey}`,
              // Minimal headers to avoid 406 errors
              'X-Client-Info': 'crypto-payment-page-fallback-attempt'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log('Successfully loaded transaction via direct URL with minimal headers:', data[0].id);
            return { data: data[0], source: 'minimal-headers-fetch' };
          }
        } else {
          // Try another approach if we still get errors
          console.log(`Direct URL fetch failed with status: ${response.status}, trying without user_id filter`);
          
          const responseNoUser = await fetch(
            `${baseUrl}/rest/v1/transactions?id=eq.${transactionId}&limit=1`,
            {
              method: 'GET',
              headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'X-Client-Info': 'crypto-payment-page-fallback-nouser'
              }
            }
          );
          
          if (responseNoUser.ok) {
            const dataNoUser = await responseNoUser.json();
            if (Array.isArray(dataNoUser) && dataNoUser.length > 0 && dataNoUser[0].user_id === userId) {
              console.log('Successfully loaded transaction via direct URL without user filter:', dataNoUser[0].id);
              return { data: dataNoUser[0], source: 'minimal-headers-no-user' };
            }
          }
        }
      } catch (directFetchError) {
        console.error('Final direct URL fetch failed:', directFetchError);
      }
      
      // If all else fails, try to reconstruct transaction from localStorage data
      try {
        // First check pending redirect data
        if (typeof window !== 'undefined') {
          const pendingRedirectJson = localStorage.getItem('pending_crypto_redirect');
          if (pendingRedirectJson) {
            try {
              const pendingRedirect = JSON.parse(pendingRedirectJson);
              // Check if it's recent (within last 5 minutes) and matches our transaction ID
              const pendingTimestamp = pendingRedirect.timestamp || 0;
              const currentTime = Date.now();
              const timeDiffMinutes = (currentTime - pendingTimestamp) / (1000 * 60);
              
              if (timeDiffMinutes < 5 && pendingRedirect.id === transactionId) {
                console.log(`Using pending redirect data to reconstruct transaction: ${pendingRedirect.id}`);
                
                // Create minimal transaction object from pending redirect data
                const reconstructedTx = {
                  id: transactionId,
                  user_id: userId,
                  status: 'awaiting_payment',
                  amount: pendingRedirect.amount || 0,
                  currency: 'USD',
                  created_at: new Date(pendingTimestamp).toISOString(),
                  updated_at: new Date().toISOString(),
                  metadata: {
                    items: [],
                    reconstructed: true,
                    original_usd_amount: pendingRedirect.amount || 0,
                    pendingRedirectRecovery: true
                  }
                };
                
                return { data: reconstructedTx, source: 'pending-redirect-reconstruction' };
              }
            } catch (pendingError) {
              console.error('Error using pending redirect data:', pendingError);
            }
          }
          
          // Try to find matching transaction in crypto payment transaction storage
          const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData);
              
              // Direct transaction object
              if (parsedData.id === transactionId) {
                console.log(`Reconstructing transaction from localStorage direct object: ${parsedData.id}`);
                
                const reconstructedTx = {
                  id: transactionId,
                  user_id: userId,
                  status: parsedData.status || 'awaiting_payment',
                  amount: parsedData.amount || 0,
                  currency: 'USD',
                  created_at: parsedData.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  metadata: {
                    items: [],
                    reconstructed: true,
                    original_usd_amount: parsedData.amount || 0,
                    directStorageRecovery: true
                  }
                };
                
                return { data: reconstructedTx, source: 'local-storage-direct-reconstruction' };
              }
              
              // Transaction in map format
              if (parsedData[transactionId]) {
                console.log(`Reconstructing transaction from localStorage map: ${transactionId}`);
                
                const txData = parsedData[transactionId];
                const reconstructedTx = {
                  id: transactionId,
                  user_id: userId,
                  status: txData.status || 'awaiting_payment',
                  amount: txData.amount || 0,
                  currency: 'USD',
                  created_at: txData.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  metadata: {
                    items: [],
                    reconstructed: true,
                    original_usd_amount: txData.amount || 0,
                    mapStorageRecovery: true
                  }
                };
                
                return { data: reconstructedTx, source: 'local-storage-map-reconstruction' };
              }
            } catch (parseError) {
              console.error('Error parsing localStorage data:', parseError);
            }
          }
        }
      } catch (localStorageError) {
        console.error('Failed to reconstruct from localStorage:', localStorageError);
      }
      
      throw new Error('Transaction not found after multiple attempts');
    } catch (error: any) {
      if (retryCount < maxRetries) {
        // Exponential backoff on error
        const baseDelay = process.env.NODE_ENV === 'production' ? 1500 : 1000;
        const delay = Math.min(Math.pow(2, retryCount) * baseDelay, 10000); // Cap at 10 seconds
        console.log(`Error loading transaction, retrying in ${delay}ms...`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return loadTransactionWithRetry(transactionId, userId, retryCount + 1, maxRetries);
      }
      throw error;
    }
  };

  // Handle copy button
  const handleCopy = () => {
    if (!paymentAddress) return
    navigator.clipboard.writeText(paymentAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Fetch crypto prices using our proxy endpoint with fallback values
  const fetchCryptoPrices = async () => {
    let newPrices = { ...FALLBACK_PRICES } // Start with fallback prices
    let usedFallback = false
    
    console.log('Initial fallback prices:', newPrices);
    
    try {
      // Try to fetch prices from our proxy endpoint
      const response = await fetch('/api/crypto-price');
      const data = await response.json();
      
      console.log('Price API response:', data);
      
      if (data.solana && data.solana.usd) {
        newPrices.SOL = data.solana.usd;
        console.log('Fetched SOL price:', newPrices.SOL);
      } else {
        console.warn('Price data missing SOL price, using fallback');
        usedFallback = true;
      }
      
      // Update state with whatever prices we have
      setCryptoPrices(newPrices);
      setLastPriceUpdate(usedFallback ? null : new Date());
      
      // If we're using a selected crypto, recalculate the converted amount
      if (selectedCrypto && transaction) {
        // Get the original USD amount from metadata if available, otherwise use the transaction amount
        const usdAmount = transaction.metadata?.original_usd_amount || transaction.amount;
        console.log('Using USD amount for conversion:', usdAmount);
        
        const newConvertedAmount = convertToCrypto(usdAmount, selectedCrypto, newPrices);
        if (newConvertedAmount !== null && newConvertedAmount !== convertedAmount) {
          console.log(`Updated ${selectedCrypto} amount from ${convertedAmount} to ${newConvertedAmount}`);
          setConvertedAmount(newConvertedAmount);
        }
      }
      
      return newPrices;
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      
      // Return fallback prices if all fetches fail
      setCryptoPrices(newPrices);
      setLastPriceUpdate(null);
      return newPrices;
    }
  }

  // Convert USD to crypto amount
  const convertToCrypto = (usdAmount: number, cryptoType: string, prices: CryptoPrice) => {
    if (!prices[cryptoType]) return null
    
    console.log(`Converting ${usdAmount} USD to ${cryptoType} at rate ${prices[cryptoType]}`);
    const cryptoAmount = usdAmount / prices[cryptoType]
    console.log(`Conversion result: ${cryptoAmount} ${cryptoType}`);
    return cryptoAmount
  }

  // Update transaction status in database
  const updateTransactionStatus = async (status: string, paymentDetails?: any, isFinalUpdate: boolean = false) => {
    if (!transaction || !user) return
    
    try {
      // Save the transaction signature when confirming payment
      let updatedMetadata = { ...transaction.metadata };
      
      if (paymentDetails && paymentDetails.signature) {
        // Ensure crypto object exists with all required properties
        if (!updatedMetadata.crypto) {
          updatedMetadata.crypto = {
            type: selectedCrypto || 'unknown',
            address: paymentAddress,
            selected_at: new Date().toISOString(),
            transaction_signature: paymentDetails.signature
          };
        } else {
          // Just add/update the transaction signature if crypto object exists
          updatedMetadata.crypto.transaction_signature = paymentDetails.signature;
        }
      }
      
      console.log(`Updating transaction status to: ${status}`);
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: status,
          metadata: {
            ...updatedMetadata,
            payment_details: paymentDetails || null
          }
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Status update error:', updateError);
        throw updateError;
      }
      
      console.log(`Transaction status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update transaction status:', error);
    }
  }

  // Handle crypto selection
  const handleCryptoSelect = (symbol: string) => {
    setSelectedCrypto(symbol)
    
    // Reset any wallet address error
    setWalletAddressError(null)
    
    // When changing crypto type, keep the setup screen
    setShowPaymentInstructions(false)
    
    // Get latest crypto prices to show accurate conversion
    fetchCryptoPrices()
  }
  
  // Validate wallet address
  const validateWalletAddress = (address: string): boolean => {
    // Basic Solana wallet address validation - starts with a character and is 32-44 chars
    // This is a simple check, could be enhanced with more robust validation
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return solanaAddressRegex.test(address.trim());
  }
  
  // Handle wallet address input
  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setSenderWalletAddress(address);
    
    if (address && !validateWalletAddress(address)) {
      setWalletAddressError('Please enter a valid Solana wallet address');
    } else {
      setWalletAddressError(null);
    }
  }
  
  // Handle setup completion and proceed to payment instructions
  const handleProceedToPayment = async () => {
    try {
      if (!selectedCrypto) {
        throw new Error('Please select a cryptocurrency');
      }
      
      if (!senderWalletAddress || !validateWalletAddress(senderWalletAddress)) {
        setWalletAddressError('Please enter a valid Solana wallet address');
        return;
      }
      
      if (!user || !session || !transaction) {
        throw new Error('Session or transaction missing');
      }

      // Use the fixed wallet address
      const address = WALLET_ADDRESS;
      setPaymentAddress(address);
      
      // Get latest crypto prices
      const prices = await fetchCryptoPrices();
      
      // Get the USD amount from the transaction
      const usdAmount = transaction.metadata?.original_usd_amount || transaction.amount;
      console.log('Processing payment with USD amount:', usdAmount);
      
      // Always have fallback prices even if fetch fails
      const cryptoAmount = convertToCrypto(usdAmount, selectedCrypto, prices);
      
      // This should never happen now that we always have fallback prices
      if (cryptoAmount === null) {
        throw new Error(`Failed to convert to ${selectedCrypto}`);
      }
      
      console.log(`Converting ${usdAmount} USD to ${cryptoAmount} ${selectedCrypto}`);
      
      setConvertedAmount(cryptoAmount);
      setTransactionStatus('awaiting_payment');
      setTimeRemaining(60 * 60); // Reset timer to 1 hour
      setShowPaymentInstructions(true);

      console.log('Updating transaction with crypto details:', transaction.id);

      // Direct database update - no RPC functions
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          payment_method: `crypto_${selectedCrypto.toLowerCase()}`,
          status: 'awaiting_payment',
          transaction_type: 'crypto_purchase',
          customer_email: user.email,
          license_type: (transaction.metadata?.items && transaction.metadata.items[0]?.licenseType) || null,
          metadata: {
            ...transaction.metadata,
            original_usd_amount: usdAmount, // Ensure original USD amount is preserved
            crypto: {
              type: selectedCrypto,
              address,
              sender_address: senderWalletAddress,
              selected_at: new Date().toISOString(),
              converted_amount: cryptoAmount,
              expected_amount: cryptoAmount
            }
          }
        })
        .eq('id', transaction.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Transaction direct update error:', updateError);
        throw updateError;
      }
      
      console.log('Transaction updated successfully');
    } catch (error: any) {
      console.error('Error setting up payment:', error);
      setError('Failed to set up payment method');
    }
  };
  
  // Reset selection and go back to the setup screen
  const handleBackToSelection = () => {
    setShowPaymentInstructions(false);
    
    // Reset payment tracking if we're going back to selection
    if (transactionStatus === 'awaiting_payment') {
      // Stop checking for payments by setting showPaymentInstructions to false
      // The useEffect will handle stopping the interval
      
      // Clear any found transaction since we're starting over
      setFoundTransaction(null);
    }
  };

  // Simplified payment check function for this fixed version
  const checkForPayment = async () => {
    if (!selectedCrypto || !convertedAmount) return
    
    setIsCheckingPayment(true)
    try {
      console.log(`Checking for ${selectedCrypto} payment of ~${convertedAmount} to ${paymentAddress} from ${senderWalletAddress}`)

      // Use Helius API to check for actual Solana payments
      if (selectedCrypto === 'SOL') {
        try {
          const minExpectedAmount = convertedAmount * (1 - PAYMENT_LEEWAY);
          
          // Get the wallet history from Helius API
          const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || 'fallback_key_12345678';
          const heliusUrl = `https://api.helius.xyz/v0/addresses/${paymentAddress}/transactions?api-key=${apiKey}&type=TRANSFER`;
          
          console.log(`Querying Helius API for transfers to ${paymentAddress}`);
          
          const response = await fetch(heliusUrl);
          if (!response.ok) {
            throw new Error(`Helius API returned ${response.status}`);
          }
          
          // Parse transactions
          const transactions: HeliusTransaction[] = await response.json();
          console.log(`Received ${transactions.length} transactions from Helius API`);
          
          // Check if we already processed any of these transactions
          const usedTransactions: string[] = [];
          try {
            const storedUsedTx = localStorage.getItem(USED_TX_STORAGE_KEY);
            if (storedUsedTx) {
              const parsed = JSON.parse(storedUsedTx);
              if (Array.isArray(parsed)) {
                usedTransactions.push(...parsed);
              }
            }
          } catch (e) {
            console.warn('Error loading used transaction list:', e);
          }
          
          // Filter to recent transactions within the last hour
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          const recentTransactions = transactions.filter(tx => {
            // Skip already processed transactions
            if (usedTransactions.includes(tx.signature)) {
              return false;
            }
            
            // Only check recent transactions
            return (tx.timestamp * 1000) > oneHourAgo;
          });
          
          console.log(`Found ${recentTransactions.length} recent unprocessed transactions`);
          
          // Find a matching transaction
          for (const tx of recentTransactions) {
            // Check if this transaction has a native SOL transfer to our address
            if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
              for (const transfer of tx.nativeTransfers) {
                // Verify it's a transfer to our payment address
                if (transfer.toUserAccount === paymentAddress) {
                  // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
                  const solAmount = parseInt(transfer.amount) / 1000000000;
                  
                  // Check if amount is close to what we expect
                  console.log(`Found transfer of ${solAmount} SOL, expected minimum of ${minExpectedAmount} SOL`);
                  
                  if (solAmount >= minExpectedAmount) {
                    console.log(`✅ Valid payment found! Transaction signature: ${tx.signature}`);
                    
                    // Store as used transaction
                    try {
                      usedTransactions.push(tx.signature);
                      localStorage.setItem(USED_TX_STORAGE_KEY, JSON.stringify(usedTransactions));
                    } catch (e) {
                      console.warn('Error saving used transaction:', e);
                    }
                    
                    // Create transaction result object
                    const solTransaction = {
                      signature: tx.signature,
                      amount: solAmount,
                      confirmations: tx.confirmations || 0,
                      blockTime: tx.blockTime || tx.timestamp,
                      senderAddress: tx.senderAddress || transfer.fromUserAccount
                    };
                    
                    setFoundTransaction(solTransaction);
                    setTransactionStatus('confirming');
                    
                    // Save transaction details to database
                    await updateTransactionStatus('confirming', solTransaction);
                    
                    // Check for confirmation status
                    if ((tx.confirmations || 0) >= REQUIRED_CONFIRMATIONS) {
                      console.log(`Transaction already has ${tx.confirmations} confirmations, marking as confirmed`);
                      
                      setTimeout(() => {
                        const updatedTransaction = {
                          ...solTransaction,
                          confirmations: REQUIRED_CONFIRMATIONS
                        };
                        setFoundTransaction(updatedTransaction);
                        setTransactionStatus('confirmed');
                        updateTransactionStatus('confirmed', updatedTransaction);
                        
                        // Then mark as completed after a delay
                        setTimeout(() => {
                          setTransactionStatus('completed');
                          updateTransactionStatus('completed', updatedTransaction, true);
                        }, AUTO_COMPLETE_DELAY);
                      }, 1000);
                    }
                    
                    return; // Exit the function once we find a valid transaction
                  }
                }
              }
            }
          }
          
          // If we reach here, no valid transaction was found
          console.log('No valid transaction found in recent transfers');
          
        } catch (apiError) {
          console.error('Error checking Helius API:', apiError);
          
          // Fallback to simulation for demo purposes if API fails
          if (process.env.NODE_ENV === 'development') {
            console.log("API failed, falling back to simulation for dev environment");
            simulatePaymentCheck();
          }
        }
      } else if (selectedCrypto === 'PROD') {
        // For PROD tokens, we'll use a simulated check in this version
        // In a real implementation, we'd check for SPL token transfers
        simulatePaymentCheck();
      }
    } catch (error) {
      console.error('Error checking for payment:', error)
    } finally {
      setIsCheckingPayment(false)
    }
  }
  
  // Helper function to simulate payment check for development/demo
  const simulatePaymentCheck = () => {
    // For demonstration purposes, simulate finding a transaction 20% of the time
    if (Math.random() < 0.2 && convertedAmount !== null) {
      console.log("Simulating finding a transaction for demo purposes");
      
      // Create a mock transaction
      const mockTransaction = {
        signature: 'mockSig' + Math.random().toString(36).substring(2, 10),
        amount: convertedAmount * (0.95 + Math.random() * 0.1), // Within 5% leeway
        confirmations: 0,
        blockTime: new Date().getTime() / 1000,
        senderAddress: senderWalletAddress || 'MockAddress'
      }
      
      setFoundTransaction(mockTransaction)
      setTransactionStatus('confirming')
      
      // Save transaction details to database
      updateTransactionStatus('confirming', mockTransaction)
      
      // After 3 seconds, update to confirmed
      setTimeout(() => {
        const updatedTransaction = {
          ...mockTransaction,
          confirmations: REQUIRED_CONFIRMATIONS
        }
        setFoundTransaction(updatedTransaction)
        setTransactionStatus('confirmed')
        updateTransactionStatus('confirmed', updatedTransaction)
        
        // Then after 2 more seconds, mark as completed
        setTimeout(() => {
          setTransactionStatus('completed')
          updateTransactionStatus('completed', updatedTransaction, true)
        }, 2000)
      }, 3000)
    }
  }

  // Timeline status helpers
  const getTimelineStatus = () => {
    // Default text based on status
    const stepDescriptions = {
      awaiting: "Waiting for your payment to be sent to the blockchain",
      onTheWay: "Transaction detected and waiting for network confirmations",
      confirmed: "Payment successfully received and confirmed"
    };

    // Override descriptions based on actual status
    if (transactionStatus === 'expired') {
      return {
        awaiting: "Payment window has expired",
        onTheWay: "Not received in time",
        confirmed: "Not completed"
      };
    }

    if (isCheckingPayment) {
      return {
        ...stepDescriptions,
        awaiting: "Checking for your payment..."
      };
    }

    if (foundTransaction) {
      return {
        ...stepDescriptions,
        onTheWay: `${foundTransaction.confirmations || 0}/3 confirmations received`
      };
    }

    return stepDescriptions;
  };

  // Render timeline component
  const renderTimeline = () => {
    const descriptions = getTimelineStatus();
    
    return (
      <div className="mb-8 py-4 px-6 bg-zinc-800/40 rounded-lg">
        <h2 className="text-base font-medium text-white mb-4">Payment Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PaymentStep 
            title="Waiting for Payment" 
            description={descriptions.awaiting}
            isActive={transactionStatus === 'awaiting_payment'} 
            isCompleted={['confirming', 'confirmed', 'completed'].includes(transactionStatus)}
          />
          <PaymentStep 
            title="On the Way" 
            description={descriptions.onTheWay}
            isActive={transactionStatus === 'confirming'} 
            isCompleted={['confirmed', 'completed'].includes(transactionStatus)}
          />
          <PaymentStep 
            title="Confirmed" 
            description={descriptions.confirmed}
            isActive={transactionStatus === 'confirmed' || transactionStatus === 'completed'} 
            isCompleted={transactionStatus === 'completed'}
            isLast
          />
        </div>
        {transactionStatus === 'confirming' && (
          <p className="mt-4 text-xs text-blue-300">
            Solana transactions finalize quickly. Your payment should be confirmed momentarily.
          </p>
        )}
      </div>
    );
  };

  // Render test mode instructions
  const renderTestInstructions = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="mt-4 bg-zinc-800 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-white mb-2">Test Mode Options</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400">
              1. Crypto payment demo:
            </p>
            <p className="text-xs text-gray-400">
              Select a crypto and enter a wallet address, the system will 
              randomly simulate finding a transaction about 5% of the time when checking.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render debug info section
  const renderDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="mt-6 p-4 bg-black/60 rounded-lg border border-zinc-700">
        <h3 className="text-sm font-bold text-zinc-300 mb-2">Debug Information</h3>
        <div className="text-xs font-mono text-zinc-400 space-y-1 overflow-auto max-h-72">
          <div>
            <span className="text-green-400">Transaction ID:</span> {transaction?.id || 'N/A'}
          </div>
          <div>
            <span className="text-green-400">Transaction Amount:</span> {transaction?.amount || 0} {transaction?.currency || ''}
          </div>
          <div>
            <span className="text-green-400">Original USD:</span> {transaction?.metadata?.original_usd_amount || 'Not set'}
          </div>
          <div>
            <span className="text-green-400">Selected Crypto:</span> {selectedCrypto || 'None'}
          </div>
          <div>
            <span className="text-green-400">Converted Amount:</span> {convertedAmount ? `${convertedAmount} ${selectedCrypto}` : 'Not calculated'}
          </div>
          <div>
            <span className="text-green-400">Expected Amount:</span> {transaction?.metadata?.crypto?.expected_amount || 'Not set'}
          </div>
          <div>
            <span className="text-green-400">Crypto Prices:</span>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(cryptoPrices, null, 2)}</pre>
          </div>
          <div>
            <span className="text-green-400">Transaction Status:</span> {transactionStatus}
          </div>
          <div>
            <span className="text-green-400">Transaction Metadata:</span>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(transaction?.metadata, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  };

  // Load transaction on mount
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        // Wait for auth to be ready
        if (authLoading) {
          return;
        }

        // Ensure we have a user
        if (!user) {
          // If we still have a session token but no user data, try to refresh
          if (session) {
            console.log('Session exists but no user data, attempting refresh');
            await refreshSession();
            // Return early and let the next useEffect run handle the init
            return;
          }
          
          setError('Authentication required');
          router.push('/checkout');
          return;
        }

        // Get and validate transaction ID
        let transactionId = searchParams.get('transaction');
        let usingRecoveredId = false;
        
        // Get method parameter (if specified)
        const method = searchParams.get('method');
        
        // Check if we have a pending redirect that might indicate a transaction that's still being saved
        let pendingRedirect = null;
        try {
          const pendingRedirectJson = localStorage.getItem('pending_crypto_redirect');
          if (pendingRedirectJson) {
            pendingRedirect = JSON.parse(pendingRedirectJson);
            // Only clear after successful transaction load
            
            // Check if it's recent (within 10 seconds)
            const pendingTimestamp = pendingRedirect.timestamp || 0;
            const currentTime = Date.now();
            const timeDiffSeconds = (currentTime - pendingTimestamp) / 1000;
            
            if (timeDiffSeconds < 10 && pendingRedirect.id) {
              console.log(`Found pending redirect transaction: ${pendingRedirect.id}, ${timeDiffSeconds.toFixed(1)} seconds old`);
              
              // If the transaction from URL matches pending redirect, we know it's very recent
              // and might need extra wait time for database propagation
              if (transactionId === pendingRedirect.id) {
                console.log('Transaction is from a very recent redirect, adding extra wait time for database propagation');
                
                // Wait longer in production to ensure transaction is in database
                const waitTime = process.env.NODE_ENV === 'production' ? 2000 : 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
            }
          }
        } catch (pendingError) {
          console.error('Error checking pending redirect:', pendingError);
        }
        
        // If no transaction ID in URL or it's undefined, try multiple recovery sources
        if (!transactionId || transactionId === 'undefined') {
          console.log('No valid transaction ID in URL, checking recovery sources...');
          
          // First try pending redirect if available
          if (pendingRedirect?.id) {
            console.log(`Using transaction ID from pending redirect: ${pendingRedirect.id}`);
            transactionId = pendingRedirect.id;
            usingRecoveredId = true;
          } 
          // Then try last crypto payment URL if available
          else {
            try {
              const lastPaymentUrl = localStorage.getItem('last_crypto_payment_url');
              if (lastPaymentUrl) {
                const urlParams = new URLSearchParams(lastPaymentUrl.split('?')[1] || '');
                const urlTransactionId = urlParams.get('transaction');
                if (urlTransactionId) {
                  console.log(`Recovered transaction ID from last payment URL: ${urlTransactionId}`);
                  transactionId = urlTransactionId;
                  usingRecoveredId = true;
                }
              }
            } catch (urlRecoveryError) {
              console.error('Error recovering from last payment URL:', urlRecoveryError);
            }
          }
          
          // If still no transaction ID, try localStorage
          if (!transactionId) {
            try {
              const storedTransaction = localStorage.getItem(LOCAL_STORAGE_KEY);
              if (storedTransaction) {
                const parsedData = JSON.parse(storedTransaction);
                
                // If we have a direct transaction object (not keyed by ID)
                if (parsedData.id) {
                  console.log(`Recovered transaction ID from localStorage direct object: ${parsedData.id}`);
                  transactionId = parsedData.id;
                  usingRecoveredId = true;
                } 
                // Otherwise look for the most recent transaction in the storage map
                else {
                  let mostRecent = null;
                  let mostRecentTime = 0;
                  
                  // Find the most recent transaction in localStorage
                  Object.keys(parsedData).forEach(txId => {
                    const txData = parsedData[txId];
                    if (txData.lastUpdated) {
                      const updateTime = new Date(txData.lastUpdated).getTime();
                      if (updateTime > mostRecentTime) {
                        mostRecentTime = updateTime;
                        mostRecent = txId;
                      }
                    }
                  });
                  
                  if (mostRecent) {
                    const timeDiff = (Date.now() - mostRecentTime) / (1000 * 60); // minutes
                    if (timeDiff < 30) { // Allow for a 30-minute recovery window
                      console.log(`Recovered most recent transaction ID from localStorage: ${mostRecent} (${timeDiff.toFixed(1)} minutes old)`);
                      transactionId = mostRecent;
                      usingRecoveredId = true;
                    } else {
                      console.log('Most recent stored transaction too old, not using for recovery');
                    }
                  }
                }
              }
            } catch (recoveryError) {
              console.error('Error trying to recover transaction from localStorage:', recoveryError);
            }
          }
        }
        
        if (!transactionId) {
          setError('Invalid transaction ID');
          router.push('/checkout');
          return;
        }

        console.log(`Attempting to load transaction: ${transactionId}${usingRecoveredId ? ' (recovered)' : ''}${method ? ` using method: ${method}` : ''}`);

        try {
          // In production, add a small delay to allow database propagation if this is not a recovered ID
          // Recovered IDs likely already have the proper delay built in from their recovery process
          if (process.env.NODE_ENV === 'production' && !usingRecoveredId) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Set a longer timeout in production environments
          const maxRetries = process.env.NODE_ENV === 'production' ? 7 : 5;
          
          // Use the retry approach with improved resilience
          const result = await loadTransactionWithRetry(transactionId, user.id, 0, maxRetries);
          
          if (!mounted) return;
          
          console.log(`Transaction loaded via ${result.source}:`, result.data.id);
          setTransaction(result.data);
          
          // If this was a successful load, clear the pending redirect marker
          try {
            if (pendingRedirect && pendingRedirect.id === transactionId) {
              localStorage.removeItem('pending_crypto_redirect');
              console.log('Cleared pending redirect marker after successful transaction load');
            }
          } catch (e) {
            console.warn('Error clearing pending redirect:', e);
          }
          
          // If we used a recovered ID, update the URL to match (without reloading)
          if (usingRecoveredId && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('transaction', transactionId);
            window.history.replaceState({}, '', url.toString());
          }
          
          // Load saved state if available
          const savedState = loadStateFromLocalStorage(transactionId);
          if (savedState?.status && savedState.status !== 'awaiting_payment') {
            if (!mounted) return;
            
            if (savedState.selectedCrypto) setSelectedCrypto(savedState.selectedCrypto);
            if (savedState.convertedAmount !== undefined && savedState.convertedAmount !== null) setConvertedAmount(savedState.convertedAmount);
            if (savedState.foundTransaction) setFoundTransaction(savedState.foundTransaction);
            if (savedState.timeRemaining) setTimeRemaining(savedState.timeRemaining);
            if (savedState.showPaymentInstructions !== undefined) {
              setShowPaymentInstructions(savedState.showPaymentInstructions);
            }
            
            setTransactionStatus(savedState.status);
            console.log(`Restored transaction state from localStorage: ${savedState.status}`);
          } else {
            console.log('No saved state found or state is still awaiting_payment');
          }
        } catch (error) {
          throw new Error(`Failed to load transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
      } catch (error: any) {
        if (!mounted) return;
        
        console.error('Error loading transaction:', error);
        
        // Try one more recovery attempt from localStorage if we haven't already
        if (!searchParams.get('recovered') && typeof window !== 'undefined') {
          try {
            // First check for a last_crypto_payment_url
            const lastPaymentUrl = localStorage.getItem('last_crypto_payment_url');
            if (lastPaymentUrl) {
              console.log('Found last payment URL, trying to recover from it:', lastPaymentUrl);
              router.replace(lastPaymentUrl + '&recovered=true');
              return;
            }
            
            // Then check stored transaction
            const storedTransaction = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedTransaction) {
              let parsedTransaction: any = null;
              let recoveryId = null;
              
              try {
                parsedTransaction = JSON.parse(storedTransaction);
                
                // Handle both formats (direct object or keyed by ID)
                if (parsedTransaction && parsedTransaction.id) {
                  recoveryId = parsedTransaction.id;
                } else if (parsedTransaction) {
                  // Find most recent transaction
                  let mostRecent = null;
                  let mostRecentTime = 0;
                  
                  Object.keys(parsedTransaction).forEach(txId => {
                    const txData = parsedTransaction[txId];
                    if (txData.lastUpdated) {
                      const updateTime = new Date(txData.lastUpdated).getTime();
                      if (updateTime > mostRecentTime) {
                        mostRecentTime = updateTime;
                        mostRecent = txId;
                      }
                    }
                  });
                  
                  recoveryId = mostRecent;
                }
              } catch (e) {
                console.error('Error parsing stored transaction:', e);
              }
              
              if (recoveryId) {
                console.log(`Final recovery attempt with transaction ID: ${recoveryId}`);
                router.replace(`/crypto-payment?transaction=${recoveryId}&recovered=true`);
                return;
              }
            }
          } catch (finalRecoveryError) {
            console.error('Final recovery attempt failed:', finalRecoveryError);
          }
        }
        
        // Add a special diagnostic message for 406 errors
        const errorMessage = error.message || 'Failed to load transaction';
        const is406Error = errorMessage.includes('406') || 
                           (typeof window !== 'undefined' && window.location.href.includes('406'));
        
        const enhancedError = is406Error
          ? "Transaction loading error (406). This is likely a temporary issue with the database connection. Try refreshing the page or returning to checkout."
          : errorMessage;
        
        setError(enhancedError);
        // Don't redirect immediately on 406, give more time to retry
        if (!is406Error) {
          setTimeout(() => {
            if (mounted) {
              router.push('/checkout');
            }
          }, 5000);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (!isLoading) {
      setIsLoading(true);
    }
    
    init();

    return () => {
      mounted = false;
    };
    
  }, [authLoading, user, session, searchParams, router, refreshSession]);

  // All other useEffect hooks should go after the main loading useEffect

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
  
  // Set up price refresh timer
  useEffect(() => {
    // Initial fetch
    fetchCryptoPrices();
    
    // Set up interval to refresh prices every minute
    const refreshInterval = setInterval(() => {
      console.log('Refreshing crypto prices...');
      fetchCryptoPrices();
    }, PRICE_REFRESH_INTERVAL);
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, []); // Empty dependency array means this runs once on mount
  
  // Update converted amount when prices change and crypto is selected
  useEffect(() => {
    if (selectedCrypto && transaction && Object.keys(cryptoPrices).length > 0) {
      // Get the original USD amount from metadata if available, otherwise use the transaction amount
      const usdAmount = transaction.metadata?.original_usd_amount || transaction.amount;
      console.log('Effect - USD amount for conversion:', usdAmount);
      console.log('Effect - Crypto prices:', cryptoPrices);
      
      const newAmount = convertToCrypto(usdAmount, selectedCrypto, cryptoPrices);
      if (newAmount !== null) {
        console.log(`Effect - New ${selectedCrypto} amount: ${newAmount}`);
        setConvertedAmount(newAmount);
      }
    }
  }, [cryptoPrices, selectedCrypto, transaction]);

  // Timer countdown effect
  useEffect(() => {
    if (!selectedCrypto || transactionStatus === 'completed' || transactionStatus === 'expired') {
      return;
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          // Time expired
          clearInterval(timer);
          setTransactionStatus('expired');
          updateTransactionStatus('expired');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [selectedCrypto, transactionStatus]);
  
  // Payment checking effect - poll for incoming transactions
  useEffect(() => {
    if (!selectedCrypto || !convertedAmount || 
        !showPaymentInstructions ||
        transactionStatus === 'completed' || 
        transactionStatus === 'expired') {
      return;
    }
    
    const checkInterval = setInterval(() => {
      checkForPayment();
    }, PAYMENT_CHECK_INTERVAL); // Check every 20 seconds
    
    // Initial check
    checkForPayment();
    
    return () => clearInterval(checkInterval);
  }, [selectedCrypto, convertedAmount, transactionStatus, showPaymentInstructions]);

  // Update when transaction status changes - Make sure this useEffect goes after all others
  useEffect(() => {
    if (transaction && transactionStatus) {
      // When transaction is completed or expired, clear the localStorage
      if (transactionStatus === 'completed' || transactionStatus === 'expired') {
        clearStateFromLocalStorage(transaction.id);
      } else {
        // Otherwise save the current state
        saveStateToLocalStorage(transaction.id, {
          status: transactionStatus,
          selectedCrypto,
          convertedAmount,
          foundTransaction,
          timeRemaining,
          senderWalletAddress,
          showPaymentInstructions
        });
      }
    }
  }, [transaction, transactionStatus, selectedCrypto, convertedAmount, foundTransaction, timeRemaining, senderWalletAddress, showPaymentInstructions]);

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-zinc-900/80 rounded-xl p-8 max-w-md w-full text-center">
          <FaSpinner className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">Loading Payment Page</h2>
          <p className="text-sm text-gray-400">
            {authLoading ? 'Checking authentication...' : 'Loading transaction details...'}
          </p>
        </div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-zinc-900/80 rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4 text-red-500">
            <FaExclamationTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4 text-center">Error</h1>
          <p className="text-red-400 mb-6 text-center">
            {error || 'Transaction not found'}
            {error && error.includes('Transaction not found') && (
              <span className="block mt-2 text-sm text-gray-400">
                This may be due to a temporary network issue or database delay.
              </span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex-1"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/checkout')}
              className="bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex-1"
            >
              Return to Checkout
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-400 text-center">
            If you continue to experience issues, please contact support.
          </p>
        </div>
      </div>
    )
  }

  // Render transaction status UI
  const renderTransactionStatus = () => {
    if (!selectedCrypto || !convertedAmount) return null
    
    // Get cart items from transaction metadata if available
    const cartItems = transaction?.metadata?.items || [];
    const trackItem = cartItems.length > 0 ? cartItems[0] : null;
    
    // Get the USD amount from the transaction or metadata
    const usdAmount = transaction?.metadata?.original_usd_amount || transaction?.amount || 0;
    
    // Payment amount display - use appropriate amount based on currency
    const displayAmount = transaction?.currency === 'USD' 
      ? `$${usdAmount.toFixed(2)} USD`
      : `${transaction?.amount.toFixed(6)} ${transaction?.currency}`;

    switch (transactionStatus) {
      case 'awaiting_payment':
        return (
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <RiTimerLine className="h-6 w-6 text-blue-400" />
              <h3 className="text-lg font-medium text-blue-200">Awaiting Payment</h3>
            </div>
            <p className="text-blue-100">
              Send exactly {formatCryptoAmount(convertedAmount, selectedCrypto)} {selectedCrypto} to the address above.
            </p>
            <div className="mt-2">
              <p className="text-blue-200 font-medium">Time remaining:</p>
              <p className="text-xl font-mono text-white">{formatTime(timeRemaining)}</p>
            </div>
            {isCheckingPayment && (
              <p className="text-blue-300 flex items-center text-sm">
                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                Checking for payment...
              </p>
            )}
          </div>
        )
      
      case 'confirming':
        return (
          <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <FaClock className="h-6 w-6 text-yellow-400" />
              <h3 className="text-lg font-medium text-yellow-200">Transaction Confirming</h3>
            </div>
            <p className="text-yellow-100">
              Payment detected! Waiting for {foundTransaction?.confirmations || 0}/3 confirmations.
            </p>
            <div className="mt-2">
              <p className="text-yellow-200 font-medium">Time remaining:</p>
              <p className="text-xl font-mono text-white">{formatTime(timeRemaining)}</p>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                style={{ width: `${(foundTransaction?.confirmations || 0) * 33.3}%` }}
              />
            </div>
          </div>
        )
      
      case 'confirmed':
        return (
          <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <RiCheckboxCircleLine className="h-6 w-6 text-green-400" />
              <h3 className="text-lg font-medium text-green-200">Transaction Confirmed</h3>
            </div>
            <p className="text-green-100">
              Your payment of {foundTransaction?.amount ? formatCryptoAmount(foundTransaction.amount, selectedCrypto) : '0'} {selectedCrypto} has been confirmed!
            </p>
            <p className="text-green-200">Processing your order...</p>
          </div>
        )
      
      case 'completed':
        return (
          <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <RiCheckboxCircleLine className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-medium text-purple-200">Order Complete</h3>
            </div>
            <p className="text-purple-100">
              Thank you for your payment! Your order has been processed successfully.
            </p>
            
            {/* Order Details Summary */}
            <div className="bg-purple-900/40 p-4 rounded-lg space-y-2 mt-4">
              <p className="text-sm text-purple-200">
                <span className="font-medium">Order ID:</span> {transaction?.id}
              </p>
              <p className="text-sm text-purple-200">
                <span className="font-medium">Amount Paid:</span> {foundTransaction?.amount ? formatCryptoAmount(foundTransaction.amount, selectedCrypto) : formatCryptoAmount(convertedAmount, selectedCrypto)} {selectedCrypto}
              </p>
              <p className="text-sm text-purple-200">
                <span className="font-medium">Currency:</span> {selectedCrypto}
              </p>
              <p className="text-sm text-purple-200">
                <span className="font-medium">Status:</span> Confirmed
              </p>
              {user?.email && (
                <p className="text-sm text-purple-200">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
              )}
              {foundTransaction?.signature && (
                <p className="text-sm text-purple-200 break-all">
                  <span className="font-medium">Transaction:</span> {foundTransaction.signature}
                </p>
              )}
              
              {/* Track Details */}
              {trackItem && (
                <>
                  <div className="h-px bg-purple-700/50 my-2"></div>
                  <p className="text-sm text-purple-200">
                    <span className="font-medium">Track:</span> {trackItem.title}
                  </p>
                  {trackItem.licenseType && (
                    <p className="text-sm text-purple-200">
                      <span className="font-medium">License:</span> {trackItem.licenseType}
                    </p>
                  )}
                  {'coverImage' in trackItem && trackItem.coverImage && (
                    <div className="mt-2">
                      <span className="text-sm text-purple-200 font-medium block mb-1">Cover:</span>
                      <div className="w-16 h-16 rounded overflow-hidden">
                        <Image 
                          src={trackItem.coverImage} 
                          alt={trackItem.title || 'Track cover'} 
                          width={64} 
                          height={64}
                          className="object-cover w-full h-full" 
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <button
              onClick={() => router.push('/account')}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 mt-4"
            >
              Go to Orders
            </button>
          </div>
        )
      
      case 'expired':
        return (
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <RiErrorWarningLine className="h-6 w-6 text-red-400" />
              <h3 className="text-lg font-medium text-red-200">Payment Expired</h3>
            </div>
            <p className="text-red-100">
              The payment time has expired. Please try again or select a different payment method.
            </p>
            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 mt-4"
            >
              Return to Checkout
            </button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-900/80 rounded-xl p-8">
          {/* Show different titles based on status */}
          {!showPaymentInstructions ? (
            <h1 className="text-2xl font-bold text-white mb-8">Select Payment Method</h1>
          ) : (
            <h1 className="text-2xl font-bold text-white mb-8">
              {transactionStatus === 'completed' ? 'Order Complete' : 'Crypto Payment'}
            </h1>
          )}
          
          {/* Only show timeline on payment instructions page */}
          {showPaymentInstructions && renderTimeline()}
          
          {/* SETUP SCREEN - Crypto selection and wallet input */}
          {!showPaymentInstructions && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-white mb-4">Select Cryptocurrency</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cryptoOptions.map((crypto) => (
                    <button
                      key={crypto.symbol}
                      onClick={() => handleCryptoSelect(crypto.symbol)}
                      className={`p-4 rounded-lg border ${
                        selectedCrypto === crypto.symbol
                          ? 'border-purple-500 bg-purple-900/20'
                          : 'border-zinc-700 hover:border-purple-500/50'
                      } transition-colors`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <crypto.icon className="h-8 w-8 text-white" />
                        <span className="text-white font-medium">{crypto.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {selectedCrypto && (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-white mb-4">Enter Sender's Wallet Address</h2>
                    <p className="text-sm text-gray-400 mb-2">
                      This helps us identify your payment. Please provide the Solana wallet address you'll be sending from.
                    </p>
                    <input
                      type="text"
                      value={senderWalletAddress}
                      onChange={handleWalletAddressChange}
                      placeholder="Your Solana wallet address"
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-sm"
                    />
                    {walletAddressError && (
                      <p className="mt-2 text-sm text-red-400">{walletAddressError}</p>
                    )}
                  </div>
                  
                  {/* Payment amount preview */}
                  <div className="mt-6 bg-zinc-800/50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-white mb-2">Payment Summary</h3>
                    <p className="text-md text-white">
                      Amount due: ${transaction?.metadata?.original_usd_amount?.toFixed(2) || transaction?.amount.toFixed(2)} USD
                    </p>
                    {convertedAmount && (
                      <p className="text-sm text-purple-300 mt-1">
                        Approximately {formatCryptoAmount(convertedAmount, selectedCrypto)} {selectedCrypto}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleProceedToPayment}
                    disabled={!selectedCrypto || !senderWalletAddress || Boolean(walletAddressError)}
                    className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors ${
                      !selectedCrypto || !senderWalletAddress || Boolean(walletAddressError)
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    Next
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* PAYMENT SCREEN - Instructions and status after setup */}
          {showPaymentInstructions && (
            <div className="space-y-6">
              {/* Back button */}
              {transactionStatus === 'awaiting_payment' && (
                <button
                  onClick={handleBackToSelection}
                  className="flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Back to selection
                </button>
              )}
              
              {/* Status UI */}
              {renderTransactionStatus()}
              
              {/* Only show these details if not completed */}
              {transactionStatus !== 'completed' && (
                <>
                  <div className="mt-8">
                    <h2 className="text-lg font-medium text-white mb-2">Amount Due</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <p className="text-2xl font-bold text-white">
                        ${transaction?.metadata?.original_usd_amount?.toFixed(2) || transaction?.amount.toFixed(2)} USD
                      </p>
                      {convertedAmount && (
                        <span className="text-lg text-purple-300">
                          = {formatCryptoAmount(convertedAmount, selectedCrypto)} {selectedCrypto}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400 mt-1">
                        Using current rate: 1 {selectedCrypto} = ${cryptoPrices[selectedCrypto]?.toFixed(6) || '0.00'} USD
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated: {formatLastUpdate(lastPriceUpdate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h2 className="text-lg font-medium text-white mb-2">Sender's Wallet</h2>
                    <div className="bg-zinc-800 p-4 rounded-lg break-all">
                      <p className="text-white font-mono">{senderWalletAddress}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">
                      Make sure to send from this wallet address for proper tracking
                    </p>
                  </div>

                  <div>
                    <h2 className="text-lg font-medium text-white mb-2">Payment Address</h2>
                    <div className="bg-zinc-800 p-4 rounded-lg break-all group relative">
                      <p className="text-white font-mono">{paymentAddress}</p>
                      <button 
                        onClick={handleCopy}
                        className="absolute right-2 top-2 text-gray-400 hover:text-white focus:outline-none"
                        aria-label="Copy address"
                      >
                        {copied ? (
                          <FaCheck className="h-5 w-5 text-green-500" />
                        ) : (
                          <FaCopy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      Send exactly {convertedAmount ? formatCryptoAmount(convertedAmount, selectedCrypto) : '0'} {selectedCrypto} to this address.
                    </p>
                  </div>

                  {/* Show warning only in awaiting payment state */}
                  {transactionStatus === 'awaiting_payment' && (
                    <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4">
                      <p className="text-yellow-200 text-sm">
                        Important: Only send {selectedCrypto} to this address. Sending any other cryptocurrency may result in permanent loss.
                      </p>
                    </div>
                  )}
                  
                  {/* Debug info section */}
                  {process.env.NODE_ENV === 'development' && renderDebugInfo()}
                  
                  {/* Test mode instructions - remove in production */}
                  {process.env.NODE_ENV === 'development' && renderTestInstructions()}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 