import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/types/supabase'

export type DiscountCode = Database['public']['Tables']['discount_codes']['Row']
export type CreateDiscountCode = Database['public']['Tables']['discount_codes']['Insert']
export type UpdateDiscountCode = Database['public']['Tables']['discount_codes']['Update']

export interface DiscountValidationResult {
  isValid: boolean
  code?: DiscountCode
  error?: string
}

export const discountService = {
  async createDiscountCode(data: CreateDiscountCode): Promise<DiscountCode | null> {
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error('Error creating discount code:', error)
      return null
    }

    return discountCode
  },

  async updateDiscountCode(id: string, data: UpdateDiscountCode): Promise<DiscountCode | null> {
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating discount code:', error)
      return null
    }

    return discountCode
  },

  async deleteDiscountCode(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting discount code:', error)
      return false
    }

    return true
  },

  async getAllDiscountCodes(): Promise<DiscountCode[]> {
    const { data: discountCodes, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching discount codes:', error)
      return []
    }

    return discountCodes
  },

  async validateDiscountCode(code: string): Promise<DiscountValidationResult> {
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .single()

    if (error || !discountCode) {
      return {
        isValid: false,
        error: 'Invalid discount code'
      }
    }

    const now = new Date()
    const expiresAt = discountCode.expires_at ? new Date(discountCode.expires_at) : null

    if (expiresAt && expiresAt < now) {
      return {
        isValid: false,
        error: 'This discount code has expired'
      }
    }

    if (discountCode.usage_limit && discountCode.used_count >= discountCode.usage_limit) {
      return {
        isValid: false,
        error: 'This discount code has reached its usage limit'
      }
    }

    return {
      isValid: true,
      code: discountCode
    }
  },

  async incrementUsageCount(id: string): Promise<boolean> {
    const { error } = await supabase.rpc('increment_discount_code_usage', { code_id: id })

    if (error) {
      console.error('Error incrementing usage count:', error)
      return false
    }

    return true
  },

  calculateDiscountedAmount(total: number, discountCode: DiscountCode): number {
    if (discountCode.type === 'percentage') {
      const discount = (total * discountCode.amount) / 100
      return Math.max(0, total - discount)
    } else {
      return Math.max(0, total - discountCode.amount)
    }
  }
} 