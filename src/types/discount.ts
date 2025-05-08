export type DiscountCode = {
  id: string;
  code: string;
  amount: number;
  type: 'percentage' | 'fixed';
  expiration: string;
  isActive: boolean;
  maxUses?: number;
  currentUses: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateDiscountCodeInput = Omit<DiscountCode, 'id' | 'currentUses' | 'createdAt' | 'updatedAt'>;
export type UpdateDiscountCodeInput = Partial<CreateDiscountCodeInput>; 