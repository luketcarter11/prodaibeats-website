export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  amount: number;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateDiscountCodeInput = Omit<DiscountCode, 'id' | 'used_count' | 'created_at' | 'updated_at'>;
export type UpdateDiscountCodeInput = Partial<CreateDiscountCodeInput>; 