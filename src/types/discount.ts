import { Database } from '@/types/supabase';

export type DiscountCode = Database['public']['Tables']['discount_codes']['Row'] & {
  description?: string;
  stripe_coupon_id?: string;
  valid_until?: string;
  max_uses?: number;
};

export type DiscountCreateRequest = Omit<DiscountCode, 'id' | 'used_count' | 'created_at' | 'updated_at'>;
export type DiscountUpdateRequest = Partial<DiscountCreateRequest>;

export interface DiscountValidationResult {
  isValid: boolean;
  code?: DiscountCode;
  error?: string;
  discountAmount?: number;
} 