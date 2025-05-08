import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import Stripe from 'stripe'
import { Database } from '@/types/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
})

type DiscountCode = Database['public']['Tables']['discount_codes']['Row']

export async function POST() {
  try {
    // Get all active discount codes from Supabase
    const { data: discountCodes, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('active', true)

    if (error) {
      throw error
    }

    // Get all existing Stripe coupons
    const existingCoupons = await stripe.coupons.list()
    const existingCouponIds = new Set(existingCoupons.data.map(coupon => coupon.id))

    // Create or update coupons in Stripe
    for (const code of (discountCodes as DiscountCode[])) {
      const couponId = `COUPON_${code.code}`
      const couponData = {
        name: code.code,
        percent_off: code.type === 'percentage' ? code.amount : undefined,
        amount_off: code.type === 'fixed' ? code.amount * 100 : undefined, // Convert to cents
        currency: code.type === 'fixed' ? 'usd' : undefined,
        duration: 'once' as const,
        max_redemptions: code.usage_limit || undefined,
        redeem_by: code.expires_at ? Math.floor(new Date(code.expires_at).getTime() / 1000) : undefined
      }

      try {
        if (existingCouponIds.has(couponId)) {
          // Delete existing coupon and create a new one since Stripe doesn't allow updates
          await stripe.coupons.del(couponId)
        }
        await stripe.coupons.create({
          id: couponId,
          ...couponData
        })
      } catch (err: any) {
        console.error(`Failed to sync coupon ${code.code}:`, err.message)
      }
    }

    // Delete coupons in Stripe that don't exist in Supabase
    const activeCouponIds = new Set((discountCodes as DiscountCode[]).map(code => `COUPON_${code.code}`))
    for (const coupon of existingCoupons.data) {
      if (!activeCouponIds.has(coupon.id)) {
        try {
          await stripe.coupons.del(coupon.id)
        } catch (err: any) {
          console.error(`Failed to delete coupon ${coupon.id}:`, err.message)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error syncing discount codes:', err)
    return NextResponse.json(
      { error: 'Failed to sync discount codes' },
      { status: 500 }
    )
  }
} 