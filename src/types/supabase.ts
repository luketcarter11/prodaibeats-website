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