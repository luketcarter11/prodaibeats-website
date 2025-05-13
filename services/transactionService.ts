import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

// Initialize Supabase client
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};

export const transactionService = {
  /**
   * Create a new transaction
   */
  async createTransaction(transaction: TransactionInsert): Promise<Transaction | null> {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createTransaction:', error);
      return null;
    }
  },

  /**
   * Get a transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error getting transaction:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTransactionById:', error);
      return null;
    }
  },

  /**
   * Get all transactions for a user
   */
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTransactions:', error);
      return [];
    }
  },

  /**
   * Get all transactions for an order
   */
  async getOrderTransactions(orderId: string): Promise<Transaction[]> {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting order transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOrderTransactions:', error);
      return [];
    }
  },

  /**
   * Update a transaction's status
   */
  async updateTransactionStatus(
    id: string, 
    status: 'pending' | 'completed' | 'failed'
  ): Promise<boolean> {
    try {
      const supabase = getSupabase();
      
      const { error } = await supabase
        .from('transactions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating transaction status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTransactionStatus:', error);
      return false;
    }
  }
}; 