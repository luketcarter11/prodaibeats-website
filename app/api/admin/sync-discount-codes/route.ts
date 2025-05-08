import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import Stripe from 'stripe'
import { Database } from '@/types/supabase'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
})

type DiscountCode = Database['public']['Tables']['discount_codes']['Row']

export async function POST() {
  try {
    console.log('Starting discount code sync with Stripe...')

    // Get all active discount codes from Supabase
    const { data: discountCodes, error: supabaseError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('active', true)

    if (supabaseError) {
      console.error('Error fetching discount codes from Supabase:', supabaseError)
      throw supabaseError
    }

    if (!discountCodes?.length) {
      console.log('No active discount codes found in Supabase')
      return NextResponse.json({ success: true, message: 'No active discount codes to sync' })
    }

    console.log(`Found ${discountCodes.length} active discount codes to sync`)

    // Get all existing Stripe coupons
    const { data: existingCoupons } = await stripe.coupons.list({
      limit: 100 // Adjust if you have more coupons
    })
    console.log(`Found ${existingCoupons.length} existing coupons in Stripe`)

    const existingCouponIds = new Set(existingCoupons.map(coupon => coupon.id))
    const syncResults = {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: 0
    }

    // Create or update coupons in Stripe
    for (const code of discountCodes) {
      try {
        console.log(`Processing discount code: ${code.code}`)
        
        // Prepare coupon data based on discount type
        const couponData = {
          id: code.code,
          name: code.code,
          duration: 'once' as const,
          currency: code.type === 'fixed' ? 'usd' : undefined,
          max_redemptions: code.usage_limit || undefined,
          redeem_by: code.expires_at ? Math.floor(new Date(code.expires_at).getTime() / 1000) : undefined,
          metadata: {
            source: 'Prod AI Beats',
            type: code.type,
            created_at: new Date().toISOString()
          }
        }

        // Add amount based on type
        if (code.type === 'percentage') {
          Object.assign(couponData, {
            percent_off: code.amount,
            amount_off: undefined
          })
        } else {
          Object.assign(couponData, {
            amount_off: Math.round(code.amount * 100), // Convert to cents
            percent_off: undefined
          })
        }

        // Delete existing coupon if it exists (Stripe doesn't allow updates)
        if (existingCouponIds.has(code.code)) {
          console.log(`Deleting existing coupon: ${code.code}`)
          await stripe.coupons.del(code.code)
          syncResults.deleted++
        }

        // Create new coupon
        console.log(`Creating new coupon: ${code.code}`, couponData)
        const newCoupon = await stripe.coupons.create(couponData)
        console.log(`Successfully created coupon: ${newCoupon.id}`)
        syncResults.created++

      } catch (err: any) {
        console.error(`Error processing coupon ${code.code}:`, err.message)
        syncResults.errors++
      }
    }

    // Delete coupons in Stripe that don't exist in Supabase
    const activeCouponCodes = new Set(discountCodes.map(code => code.code))
    for (const coupon of existingCoupons) {
      try {
        if (!activeCouponCodes.has(coupon.id)) {
          console.log(`Deleting unused coupon from Stripe: ${coupon.id}`)
          await stripe.coupons.del(coupon.id)
          syncResults.deleted++
        }
      } catch (err: any) {
        console.error(`Error deleting coupon ${coupon.id}:`, err.message)
        syncResults.errors++
      }
    }

    console.log('Sync completed with results:', syncResults)

    return NextResponse.json({
      success: true,
      message: 'Discount codes synced successfully',
      results: syncResults
    })

  } catch (err: any) {
    console.error('Error syncing discount codes:', err)
    return NextResponse.json(
      {
        error: 'Failed to sync discount codes',
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    )
  }
} 