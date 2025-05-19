import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface Transaction {
  id: string;          // UUID in database
  user_id: string;     // UUID in database
  order_id: string | null;    // UUID in database
  amount: number;
  currency: string;
  transaction_type: 'payment' | 'refund' | 'chargeback' | 'crypto_purchase';
  status: 'pending' | 'completed' | 'failed' | 'awaiting_payment';
  stripe_transaction_id: string | null;
  stripe_session_id: string | null;
  customer_email: string | null;
  license_type: string | null;
  metadata: {
    track_id?: string;
    track_name?: string;
    license_file?: string;
    items?: Array<{
      id: string;
      title: string;
      price: number;
      licenseType: string;
      coverImage?: string;
    }>;
    crypto?: {
      type: string;
      address?: string;
      selected_at: string;
      expected_amount?: number;
      transaction_signature?: string;
    };
    payment_details?: {
      amount: number;
      blockTime: number;
      signature: string;
      confirmations: number;
      senderAddress: string;
    };
    original_usd_amount?: number;
  } | null;
  created_at: string;
  updated_at: string;
}

// Always use the real endpoints, regardless of environment
// This will ensure we're always fetching from the database
const USE_TEST_ENDPOINT = false;

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  try {
    // In case no userId is provided
    if (!userId) {
      console.warn('getUserTransactions called without a userId');
      return [];
    }

    const supabase = createClientComponentClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    const endpoint = USE_TEST_ENDPOINT 
      ? `/api/test-transactions?userId=${userId}`
      : `/api/transactions?userId=${userId}`;
      
    console.log(`Fetching user transactions from: ${endpoint}`);
    const response = await fetch(endpoint, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch transactions: ${response.status} ${errorText}`);
    }
    const transactions: Transaction[] = await response.json();
    console.log(`Fetched ${transactions.length} transactions for user ${userId}`);
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const supabase = createClientComponentClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No authentication token found')
    }
    
    const endpoint = USE_TEST_ENDPOINT 
      ? `/api/test-transactions?admin=true`
      : `/api/transactions?admin=true`;
      
    console.log(`Fetching all transactions from: ${endpoint}`);
    const response = await fetch(endpoint, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch all transactions: ${response.status} ${errorText}`);
    }
    const transactions: Transaction[] = await response.json();
    console.log(`Fetched ${transactions.length} total transactions`);
    return transactions;
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    return [];
  }
} 