export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      discount_codes: {
        Row: {
          id: string
          code: string
          type: 'percentage' | 'fixed'
          amount: number
          expires_at: string | null
          usage_limit: number | null
          used_count: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['discount_codes']['Row'], 'id' | 'used_count' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['discount_codes']['Insert']>
      }
      orders: {
        Row: {
          id: string
          user_id: string
          track_id: string
          track_name: string
          license: string
          total_amount: number
          discount: number | null
          order_date: string
          status: 'pending' | 'completed' | 'failed'
          stripe_session_id: string | null
          customer_email: string | null
          currency: string | null
          license_file: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          order_id: string | null
          user_id: string
          amount: number
          currency: string
          transaction_type: 'payment' | 'refund' | 'chargeback'
          status: 'pending' | 'completed' | 'failed'
          stripe_transaction_id: string | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      discount_type: 'percentage' | 'fixed'
    }
  }
} 