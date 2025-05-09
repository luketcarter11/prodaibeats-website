import { supabase } from '@/lib/supabaseClient'
import { DiscountCode, DiscountCreateRequest, DiscountUpdateRequest, DiscountValidationResult } from '@/types/discount'

export type { DiscountCode, DiscountCreateRequest, DiscountUpdateRequest, DiscountValidationResult }

export const discountService = {
  async createDiscountCode(data: DiscountCreateRequest): Promise<DiscountCode | null> {
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

  async updateDiscountCode(id: string, data: DiscountUpdateRequest): Promise<DiscountCode | null> {
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

  async validateDiscountCode(code: string, total?: number): Promise<DiscountValidationResult> {
    try {
      const { data: discount, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .single()

      if (error || !discount) {
        return {
          isValid: false,
          error: 'Invalid or inactive discount code'
        }
      }

      // Check if code has expired
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        return {
          isValid: false,
          error: 'This discount code has expired'
        }
      }

      // Check usage limit
      if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
        return {
          isValid: false,
          error: 'This discount code has reached its usage limit'
        }
      }

      // Calculate discount amount if total is provided
      let discountAmount
      if (total) {
        discountAmount = discount.type === 'percentage'
          ? (total * discount.amount) / 100
          : discount.amount
      }

      return {
        isValid: true,
        code: discount,
        discountAmount
      }
    } catch (err) {
      console.error('Error validating discount code:', err)
      return {
        isValid: false,
        error: 'Failed to validate discount code'
      }
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

  async decrementUsageCount(id: string): Promise<boolean> {
    const { error } = await supabase.rpc('decrement_discount_code_usage', { code_id: id })

    if (error) {
      console.error('Error decrementing usage count:', error)
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