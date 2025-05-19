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
  const WALLET_ADDRESS = 'GaT93YoCUZ98baT3XQh8m1FgvTweSeNqYnkwrjdmwsJv'
  const PROD_CONTRACT = 'FwqCgnf1H46XtPU2B1aDQRyKMhUpqaWkyuQ4yQ1ibouN'
  const PAYMENT_LEEWAY = 0.15 // 15% leeway for payment amount
  const PRICE_REFRESH_INTERVAL = 60 * 1000 // 1 minute in milliseconds
  const HELIUS_API_KEY = '416cd7da-9a54-4a09-9839-fc4aa991b730' // Helius API key
  const PAYMENT_CHECK_INTERVAL = 20 * 1000 // Check every 20 seconds
  const REQUIRED_CONFIRMATIONS = 1 // Solana transactions only need 1 confirmation
  const AUTO_COMPLETE_DELAY = 2000 // Auto-complete after 2 seconds once transaction is found
  const LOCAL_STORAGE_KEY = 'crypto_payment_state' // Key for storing state in localStorage
  const USED_TX_STORAGE_KEY = 'used_crypto_transactions' // Key for storing used transaction signatures

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

  // Update when transaction status changes
  useEffect(() => {
    if (transaction && transactionStatus) {
      // When transaction is completed or expired, clear the localStorage
      if (transactionStatus === 'completed' || transactionStatus === 'expired') {
        clearStateFromLocalStorage(transaction.id)
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
        })
      }
    }
  }, [transactionStatus, transaction, selectedCrypto, convertedAmount, foundTransaction, timeRemaining, senderWalletAddress, showPaymentInstructions])

  // Create sample transaction for testing
  const createSampleTransaction = (cryptoType: string, amount: number | null): HeliusTransaction => {
    if (!amount) amount = 1.0; // Default if amount is null
    
    // Use the provided sender wallet address if available, or generate a mock one
    const fromAddress = senderWalletAddress || 'MockSenderAddress' + Math.random().toString(36).substring(2, 8);
    
    if (cryptoType === 'SOL') {
      // Create sample SOL transaction
      return {
        signature: 'mockSOL' + Math.random().toString(36).substring(2, 8),
        type: 'TRANSFER',
        timestamp: Date.now(),
        slot: 12345678,
        fee: 5000,
        nativeTransfers: [
          {
            fromUserAccount: fromAddress,
            toUserAccount: WALLET_ADDRESS,
            amount: (amount * 1000000000).toString() // Convert to lamports
          }
        ],
        confirmations: 0
      }
    } else {
      // Create sample PROD transaction
      return {
        signature: 'mockPROD' + Math.random().toString(36).substring(2, 8),
        type: 'TRANSFER',
        timestamp: Date.now(),
        slot: 12345678,
        fee: 5000,
        tokenTransfers: [
          {
            fromUserAccount: fromAddress,
            toUserAccount: WALLET_ADDRESS,
            mint: PROD_CONTRACT,
            amount: amount.toString()
          }
        ],
        confirmations: 0
      }
    }
  }

  // Function to check if a transaction signature has been used already
  const isTransactionUsed = async (signature: string): Promise<boolean> => {
    if (!signature) return false;
    
    try {
      // First check local storage for quick response
      const usedTxs = JSON.parse(localStorage.getItem(USED_TX_STORAGE_KEY) || '[]');
      if (usedTxs.includes(signature)) {
        console.log(`Transaction ${signature} found in local storage as used`);
        return true;
      }
      
      // Then check database to be sure
      if (user) {
        // Check if this transaction is already linked to any order
        const { data: existingOrders, error } = await supabase
          .from('transactions')
          .select('id, status, metadata')
          .contains('metadata', { crypto: { transaction_signature: signature } });
        
        if (error) {
          console.error('Error checking for existing transaction usage:', error);
          return false; // If error, assume it's not used to prevent blocking payments
        }
        
        if (existingOrders && existingOrders.length > 0) {
          // If found orders with this transaction, mark it as used in local storage too
          saveUsedTransaction(signature);
          
          console.log(`Transaction ${signature} found in database as used for order(s):`, 
            existingOrders.map(o => o.id).join(', '));
          return true;
        }
      }
      
      return false;
    } catch (e) {
      console.error('Error checking transaction usage:', e);
      return false; // If error, assume it's not used to prevent blocking payments
    }
  };
  
  // Function to mark a transaction signature as used
  const saveUsedTransaction = (signature: string): void => {
    if (!signature) return;
    
    try {
      // Save to local storage
      const usedTxs = JSON.parse(localStorage.getItem(USED_TX_STORAGE_KEY) || '[]');
      
      if (!usedTxs.includes(signature)) {
        usedTxs.push(signature);
        localStorage.setItem(USED_TX_STORAGE_KEY, JSON.stringify(usedTxs));
      }
      
      console.log(`Marked transaction ${signature} as used`);
    } catch (e) {
      console.error('Error saving used transaction:', e);
    }
  };

  // Modify the checkForPayment function to check for used transactions
  const checkForPayment = async () => {
    if (!selectedCrypto || !convertedAmount) return
    
    setIsCheckingPayment(true)
    try {
      console.log(`Checking for ${selectedCrypto} payment of ~${convertedAmount} to ${paymentAddress} from ${senderWalletAddress}`)

      // Don't check for real transactions if we're already in a processing state
      if (transactionStatus !== 'awaiting_payment' && transactionStatus !== 'confirming') {
        setIsCheckingPayment(false)
        return
      }
      
      // TESTING MODES
      // 1. Demo flow with auto-confirmations
      if (localStorage.getItem('demo_transaction_trigger') === 'true') {
        localStorage.removeItem('demo_transaction_trigger') // Use only once
        simulateMockTransaction()
        setIsCheckingPayment(false)
        return
      }
      
      // 2. Instant test transaction
      if (localStorage.getItem('instant_test_transaction') === 'true') {
        localStorage.removeItem('instant_test_transaction') // Use only once
        
        // Create and process a sample transaction with the expected amount
        const sampleTx = createSampleTransaction(selectedCrypto, convertedAmount)
        processSampleTransaction(sampleTx)
        setIsCheckingPayment(false)
        return
      }
      
      // 3. Custom test transaction with specified confirmations
      const customTest = localStorage.getItem('custom_test_transaction')
      if (customTest) {
        localStorage.removeItem('custom_test_transaction')
        try {
          const testConfig = JSON.parse(customTest)
          const sampleTx = createSampleTransaction(selectedCrypto, convertedAmount)
          
          // Apply any custom parameters
          if (testConfig.confirmations) {
            sampleTx.confirmations = testConfig.confirmations
          }
          
          processSampleTransaction(sampleTx)
          setIsCheckingPayment(false)
          return
        } catch (e) {
          console.error('Invalid custom test configuration', e)
        }
      }
      
      // Real payment checking with Helius API
      try {
        // Fetch recent transactions for our wallet address
        const response = await fetch(
          `https://api.helius.xyz/v0/addresses/${WALLET_ADDRESS}/transactions?api-key=${HELIUS_API_KEY}&limit=20`
        )
        
        if (!response.ok) {
          throw new Error(`Helius API error: ${response.status} ${response.statusText}`)
        }
        
        const transactions: HeliusTransaction[] = await response.json()
        console.log(`Found ${transactions.length} recent transactions for wallet`)
        
        // Calculate acceptable amount range with leeway
        const minAcceptableAmount = convertedAmount * (1 - PAYMENT_LEEWAY)
        const maxAcceptableAmount = convertedAmount * (1 + PAYMENT_LEEWAY)
        
        // Filter out any transactions that have already been used for payments
        const unusedTransactions = await Promise.all(
          transactions.map(async tx => {
            const used = await isTransactionUsed(tx.signature);
            return { tx, used };
          })
        );
        
        const availableTransactions = unusedTransactions
          .filter(item => !item.used)
          .map(item => item.tx);
        
        console.log(`Found ${availableTransactions.length} unused transactions out of ${transactions.length} total`);
        
        // Find matching transaction based on token type
        let matchingTx: HeliusTransaction | undefined
        
        if (selectedCrypto === 'SOL') {
          // For SOL transfers, look for native SOL transfers
          matchingTx = availableTransactions.find(tx => 
            // Look for native SOL transfers
            tx.type === 'TRANSFER' && 
            tx.nativeTransfers?.some(transfer => 
              transfer.toUserAccount === WALLET_ADDRESS &&
              // If we have a sender address, verify it matches
              (!senderWalletAddress || transfer.fromUserAccount === senderWalletAddress) &&
              // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
              parseFloat(transfer.amount) / 1000000000 >= minAcceptableAmount &&
              parseFloat(transfer.amount) / 1000000000 <= maxAcceptableAmount
            )
          )
        } else if (selectedCrypto === 'PROD') {
          // For PROD token transfers
          matchingTx = availableTransactions.find(tx =>
            tx.tokenTransfers?.some(transfer =>
              transfer.mint === PROD_CONTRACT &&
              transfer.toUserAccount === WALLET_ADDRESS &&
              // If we have a sender address, verify it matches
              (!senderWalletAddress || transfer.fromUserAccount === senderWalletAddress) &&
              // Amount comparison depends on token decimals
              parseFloat(transfer.amount) >= minAcceptableAmount &&
              parseFloat(transfer.amount) <= maxAcceptableAmount
            )
          )
        }
        
        if (matchingTx) {
          // Mark this transaction as used immediately to prevent race conditions
          saveUsedTransaction(matchingTx.signature);
          processTransaction(matchingTx)
        } else if (foundTransaction && transactionStatus === 'confirming') {
          // If we already found a transaction, check its confirmation status
          try {
            const txStatusResponse = await fetch(
              `https://api.helius.xyz/v0/transactions/${foundTransaction.signature}?api-key=${HELIUS_API_KEY}`
            )
            
            if (txStatusResponse.ok) {
              const txDetails: HeliusTransaction = await txStatusResponse.json()
              
              if (txDetails.confirmations !== foundTransaction.confirmations) {
                const updatedTransaction = {
                  ...foundTransaction,
                  confirmations: txDetails.confirmations || foundTransaction.confirmations
                }
                
                setFoundTransaction(updatedTransaction)
                
                if (updatedTransaction.confirmations >= 3) {
                  setTransactionStatus('confirmed')
                  await updateTransactionStatus('confirmed', updatedTransaction)
                  
                  setTimeout(() => {
                    setTransactionStatus('completed')
                    updateTransactionStatus('completed', updatedTransaction)
                  }, 3000)
                }
              }
            }
          } catch (txStatusError) {
            console.error('Error checking transaction status:', txStatusError)
          }
        }
      } catch (heliusError) {
        console.error('Helius API error:', heliusError)
      }
    } catch (error) {
      console.error('Error checking for payment:', error)
    } finally {
      setIsCheckingPayment(false)
    }
  }
  
  // Process a real transaction from Helius API
  const processTransaction = (matchingTx: HeliusTransaction) => {
    console.log('Found matching transaction:', matchingTx.signature)
    
    // Extract payment details
    let paymentAmount = 0
    let senderAddress = ''
    
    if (selectedCrypto === 'SOL' && matchingTx.nativeTransfers) {
      const solTransfer = matchingTx.nativeTransfers.find(t => t.toUserAccount === WALLET_ADDRESS)
      if (solTransfer) {
        paymentAmount = parseFloat(solTransfer.amount) / 1000000000 // Convert lamports to SOL
        senderAddress = solTransfer.fromUserAccount
      }
    } else if (selectedCrypto === 'PROD' && matchingTx.tokenTransfers) {
      const tokenTransfer = matchingTx.tokenTransfers.find(t => 
        t.mint === PROD_CONTRACT && t.toUserAccount === WALLET_ADDRESS
      )
      if (tokenTransfer) {
        paymentAmount = parseFloat(tokenTransfer.amount)
        senderAddress = tokenTransfer.fromUserAccount
      }
    }
    
    // Create transaction record
    const txRecord = {
      signature: matchingTx.signature,
      amount: paymentAmount,
      confirmations: matchingTx.confirmations || 1,
      blockTime: matchingTx.timestamp / 1000, // Helius uses milliseconds
      senderAddress: senderAddress
    }
    
    // Validate that the sender address matches if provided
    if (senderWalletAddress && senderAddress && senderWalletAddress !== senderAddress) {
      console.warn(`Transaction sender address (${senderAddress}) does not match expected (${senderWalletAddress})`)
      // We still process the transaction if it matches amount and recipient
      // But log this discrepancy for tracking
    }
    
    // If this is a new transaction (not already being tracked)
    if (!foundTransaction || foundTransaction.signature !== txRecord.signature) {
      setFoundTransaction(txRecord)
      setTransactionStatus('confirming')
      updateTransactionStatus('confirming', txRecord)
      
      // For Solana, we can consider transactions confirmed almost immediately
      // Since the network finality is very fast
      console.log('Solana transaction detected, proceeding to confirmation quickly...')
      
      // Short delay to show the confirming state briefly for UX purposes
      setTimeout(() => {
        const confirmedTransaction = {
          ...txRecord,
          confirmations: REQUIRED_CONFIRMATIONS
        }
        
        setFoundTransaction(confirmedTransaction)
        setTransactionStatus('confirmed')
        updateTransactionStatus('confirmed', confirmedTransaction)
        
        // Then quickly move to completed
        setTimeout(() => {
          setTransactionStatus('completed')
          updateTransactionStatus('completed', confirmedTransaction, true) // Mark as final update
        }, AUTO_COMPLETE_DELAY)
      }, AUTO_COMPLETE_DELAY)
    } 
    // If transaction exists and has new confirmations
    else if (txRecord.confirmations !== foundTransaction.confirmations) {
      const updatedTransaction = {
        ...foundTransaction,
        confirmations: txRecord.confirmations
      }
      
      setFoundTransaction(updatedTransaction)
      
      // If we have enough confirmations, mark as confirmed
      if (txRecord.confirmations >= REQUIRED_CONFIRMATIONS) {
        setTransactionStatus('confirmed')
        updateTransactionStatus('confirmed', updatedTransaction)
        
        // After a short delay, mark as completed
        setTimeout(() => {
          setTransactionStatus('completed')
          updateTransactionStatus('completed', updatedTransaction, true) // Mark as final update
        }, AUTO_COMPLETE_DELAY)
      }
    }
  }
  
  // Process a sample transaction for testing
  const processSampleTransaction = (sampleTx: HeliusTransaction) => {
    console.log('Processing sample transaction for testing:', sampleTx.signature)
    
    // If confirmations explicitly set in the sample, use the normal process
    if (sampleTx.confirmations && sampleTx.confirmations >= REQUIRED_CONFIRMATIONS) {
      processTransaction(sampleTx)
      return
    }
    
    // Otherwise use a quicker process for testing
    const txRecord = {
      signature: sampleTx.signature,
      amount: convertedAmount || 1.0,
      confirmations: 0,
      blockTime: Date.now() / 1000
    }
    
    setFoundTransaction(txRecord)
    setTransactionStatus('confirming')
    updateTransactionStatus('confirming', txRecord)
    
    // Use shorter timeframes for testing
    setTimeout(() => {
      const updatedTransaction = {
        ...txRecord,
        confirmations: REQUIRED_CONFIRMATIONS
      }
      setFoundTransaction(updatedTransaction)
      setTransactionStatus('confirmed')
      updateTransactionStatus('confirmed', updatedTransaction)
      
      setTimeout(() => {
        setTransactionStatus('completed')
        updateTransactionStatus('completed', updatedTransaction)
      }, AUTO_COMPLETE_DELAY)
    }, AUTO_COMPLETE_DELAY * 2)
  }
  
  // Simulate a mock transaction for testing (DEV ONLY)
  const simulateMockTransaction = () => {
    // Make sure convertedAmount is not null
    const amount = convertedAmount || 1.0;
    
    // Use the provided sender wallet address if available
    const fromAddress = senderWalletAddress || 'MockSenderAddress' + Math.random().toString(36).substring(2, 8);
    
    // Mock transaction for UI testing
    const mockTransaction = {
      signature: 'mockSig' + Math.random().toString(36).substring(2, 10),
      amount: amount * (0.95 + Math.random() * 0.1), // Within leeway
      confirmations: 0,
      blockTime: new Date().getTime() / 1000,
      senderAddress: fromAddress // Store sender address with transaction info
    }
    
    setFoundTransaction(mockTransaction)
    setTransactionStatus('confirming')
    
    // Save transaction details to database
    updateTransactionStatus('confirming', mockTransaction)
    
    // Use shorter timeframes for testing
    setTimeout(() => {
      const updatedTransaction = {
        ...mockTransaction,
        confirmations: REQUIRED_CONFIRMATIONS
      }
      setFoundTransaction(updatedTransaction)
      setTransactionStatus('confirmed')
      updateTransactionStatus('confirmed', updatedTransaction)
      
      setTimeout(() => {
        setTransactionStatus('completed')
        updateTransactionStatus('completed', updatedTransaction)
      }, AUTO_COMPLETE_DELAY)
    }, AUTO_COMPLETE_DELAY * 2) // Give a bit more time to see the confirming state
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
        
        // Mark transaction as used
        saveUsedTransaction(paymentDetails.signature);
      }
      
      // For the final update (completed), perform a more comprehensive database update
      if (isFinalUpdate && status === 'completed') {
        console.log('Performing final transaction update to database');
        
        const cryptoAmount = paymentDetails?.amount || convertedAmount || 0;
        const userEmail = user.email || null;
        const cartItems = updatedMetadata?.items || [];
        const firstItem = cartItems.length > 0 ? cartItems[0] : null;
        const licenseType = firstItem?.licenseType || null;
        
        const enhancedMetadata = {
          ...updatedMetadata,
          payment_details: {
            ...paymentDetails,
            confirmed_at: new Date().toISOString()
          },
          crypto_payment: {
            amount_in_crypto: cryptoAmount,
            currency: selectedCrypto,
            transaction_hash: paymentDetails?.signature || '',
            sender_address: senderWalletAddress,
            confirmation_time: new Date().toISOString(),
            original_usd_amount: transaction.amount // Store the original USD amount
          }
        };

        const finalUpdatePayload = {
          status: 'completed',
          amount: cryptoAmount, // Use the actual crypto amount sent
          currency: selectedCrypto, // Use the crypto currency (e.g., SOL, PROD)
          customer_email: userEmail,
          license_type: licenseType,
          payment_method: `crypto_${selectedCrypto.toLowerCase()}`,
          transaction_type: 'crypto_purchase',
          metadata: enhancedMetadata
        };
        
        console.log('About to update transaction with (primary final attempt):', finalUpdatePayload);
        
        const { error: updateError } = await supabase
          .from('transactions')
          .update(finalUpdatePayload)
          .eq('id', transaction.id);
          
        if (updateError) {
          console.error('PRIMARY Transaction final update error:', updateError);
          console.log('Attempting fallback final update approach with the same payload...');
          
          const { error: fallbackError } = await supabase
            .from('transactions')
            .update(finalUpdatePayload)
            .eq('id', transaction.id);
            
          if (fallbackError) {
            console.error('Fallback final update also failed:', fallbackError);
            
            // Last resort: Just update status and metadata, but still try to include critical info
            const lastResortPayload = {
              status: 'completed',
              amount: cryptoAmount, // Still include the crypto amount
              currency: selectedCrypto, // Still include the crypto currency
              customer_email: userEmail,
              license_type: licenseType,
              payment_method: `crypto_${selectedCrypto.toLowerCase()}`,
              transaction_type: 'crypto_purchase',
              metadata: enhancedMetadata
            };
            console.log('Attempting last resort final update with:', lastResortPayload);
            const { error: lastResortError } = await supabase
              .from('transactions')
              .update(lastResortPayload)
              .eq('id', transaction.id);
              
            if (lastResortError) {
              console.error('Last resort final update failed:', lastResortError);
              throw lastResortError;
            } else {
              console.log('Last resort final update succeeded with some critical fields and metadata');
            }
          } else {
            console.log('Fallback final update succeeded with comprehensive payload.');
          }
        } else {
          console.log('PRIMARY Transaction final update successful!');
        }
      }
      // For intermediate status updates
      else if (status !== transaction.status) {
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
      } else {
        console.log(`Skipping redundant status update: ${status}`);
      }
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  }

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
          setError('Authentication required');
          router.push('/checkout');
          return;
        }

        // Get and validate transaction ID
        const transactionId = searchParams.get('transaction');
        if (!transactionId || transactionId === 'undefined') {
          setError('Invalid transaction ID');
          router.push('/checkout');
          return;
        }

        // Try RPC function first
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'get_transaction_by_id',
            {
              p_transaction_id: transactionId,
              p_user_id: user.id
            }
          );

          if (rpcError) {
            throw rpcError;
          }

          if (!rpcData || !rpcData[0]) {
            throw new Error('Transaction not found');
          }

          if (!mounted) return;

          const transactionData = rpcData[0];
          setTransaction(transactionData);

          // Load saved state if available
          const savedState = loadStateFromLocalStorage(transactionId);
          if (savedState?.status && savedState.status !== 'awaiting_payment') {
            if (!mounted) return;
            
            if (savedState.selectedCrypto) setSelectedCrypto(savedState.selectedCrypto);
            if (savedState.convertedAmount) setConvertedAmount(savedState.convertedAmount);
            if (savedState.foundTransaction) setFoundTransaction(savedState.foundTransaction);
            if (savedState.timeRemaining) setTimeRemaining(savedState.timeRemaining);
            if (savedState.showPaymentInstructions !== undefined) {
              setShowPaymentInstructions(savedState.showPaymentInstructions);
            }
            
            setTransactionStatus(savedState.status);
          }
        } catch (rpcError) {
          console.error('RPC fetch failed, trying direct fetch:', rpcError);
          
          // Fallback to direct fetch
          const { data: directData, error: directError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .eq('user_id', user.id)
            .single();

          if (directError || !directData) {
            throw new Error('Failed to load transaction');
          }

          if (!mounted) return;

          setTransaction(directData);

          // Load saved state if available
          const savedState = loadStateFromLocalStorage(transactionId);
          if (savedState?.status && savedState.status !== 'awaiting_payment') {
            if (!mounted) return;
            
            if (savedState.selectedCrypto) setSelectedCrypto(savedState.selectedCrypto);
            if (savedState.convertedAmount) setConvertedAmount(savedState.convertedAmount);
            if (savedState.foundTransaction) setFoundTransaction(savedState.foundTransaction);
            if (savedState.timeRemaining) setTimeRemaining(savedState.timeRemaining);
            if (savedState.showPaymentInstructions !== undefined) {
              setShowPaymentInstructions(savedState.showPaymentInstructions);
            }
            
            setTransactionStatus(savedState.status);
          }
        }
      } catch (error: any) {
        if (!mounted) return;
        
        console.error('Error loading transaction:', error);
        setError(error.message || 'Failed to load transaction');
        setTimeout(() => router.push('/checkout'), 2000);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
    };
  }, [user, authLoading, searchParams, router]);

  // Check session status on component mount
  useEffect(() => {
    if (user && !session) {
      // User state exists but no session, try to refresh
      const attemptSessionRefresh = async () => {
        await refreshSession()
      }
      attemptSessionRefresh()
    }
  }, [user, session, refreshSession])
  
  // Set up price refresh timer
  useEffect(() => {
    // Initial fetch
    fetchCryptoPrices()
    
    // Set up interval to refresh prices every minute
    const refreshInterval = setInterval(() => {
      console.log('Refreshing crypto prices...')
      fetchCryptoPrices()
    }, PRICE_REFRESH_INTERVAL)
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval)
  }, []) // Empty dependency array means this runs once on mount
  
  // Update converted amount when prices change and crypto is selected
  useEffect(() => {
    if (selectedCrypto && transaction && Object.keys(cryptoPrices).length > 0) {
      // Get the original USD amount from metadata if available, otherwise use the transaction amount
      const usdAmount = transaction.metadata?.original_usd_amount || transaction.amount;
      console.log('Effect - USD amount for conversion:', usdAmount);
      console.log('Effect - Crypto prices:', cryptoPrices);
      
      const newAmount = convertToCrypto(usdAmount, selectedCrypto, cryptoPrices)
      if (newAmount !== null) {
        console.log(`Effect - New ${selectedCrypto} amount: ${newAmount}`);
        setConvertedAmount(newAmount)
      }
    }
  }, [cryptoPrices, selectedCrypto, transaction])

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
  
  // Validate and handle wallet address
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

  // Timer countdown effect
  useEffect(() => {
    if (!selectedCrypto || transactionStatus === 'completed' || transactionStatus === 'expired') {
      return
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          // Time expired
          clearInterval(timer)
          setTransactionStatus('expired')
          updateTransactionStatus('expired')
          return 0
        }
        return prevTime - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [selectedCrypto, transactionStatus])
  
  // Payment checking effect - poll for incoming transactions
  useEffect(() => {
    if (!selectedCrypto || !convertedAmount || 
        !showPaymentInstructions ||
        transactionStatus === 'completed' || 
        transactionStatus === 'expired') {
      return
    }
    
    const checkInterval = setInterval(() => {
      checkForPayment()
    }, PAYMENT_CHECK_INTERVAL) // Check every 20 seconds
    
    // Initial check
    checkForPayment()
    
    return () => clearInterval(checkInterval)
  }, [selectedCrypto, convertedAmount, transactionStatus, showPaymentInstructions])

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

  // Add this in the return statement after the main title and before the crypto selection
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

  // Add to the end of the UI in the test mode instructions area
  const renderTestInstructions = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="mt-4 bg-zinc-800 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-white mb-2">Test Mode Options</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400">
              1. Full simulation with gradual confirmations:
            </p>
            <code className="block mt-1 p-2 bg-black rounded text-xs text-green-400 font-mono">
              localStorage.setItem('demo_transaction_trigger', 'true')
            </code>
          </div>
          
          <div>
            <p className="text-xs text-gray-400">
              2. Instant transaction with gradual confirmations:
            </p>
            <code className="block mt-1 p-2 bg-black rounded text-xs text-green-400 font-mono">
              localStorage.setItem('instant_test_transaction', 'true')
            </code>
          </div>
          
          <div>
            <p className="text-xs text-gray-400">
              3. Custom test transaction with specific confirmations:
            </p>
            <code className="block mt-1 p-2 bg-black rounded text-xs text-green-400 font-mono">
              localStorage.setItem(&apos;custom_test_transaction&apos;, JSON.stringify(&#123;&quot;confirmations&quot;: 3&#125;))
            </code>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Then refresh the page or select a crypto again.
        </p>
      </div>
    );
  };

  // Add a debug section for development only
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
          <p className="text-red-400 mb-6 text-center">{error || 'Transaction not found'}</p>
          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Return to Checkout
          </button>
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