import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { DiscountCode, DiscountCreateRequest, DiscountUpdateRequest } from '@/types/discount';
import { Database } from '@/types/supabase';

// Edge and Streaming flags
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

// Initialize Supabase with runtime check
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

async function syncWithStripe(discount: DiscountCode): Promise<string | null> {
  try {
    // Check if coupon exists in Stripe
    if (discount.stripe_coupon_id) {
      try {
        await stripe.coupons.retrieve(discount.stripe_coupon_id);
        return discount.stripe_coupon_id;
      } catch (error) {
        // Coupon doesn't exist in Stripe, will create new one
      }
    }

    // Create new coupon in Stripe
    const stripeCoupon = await stripe.coupons.create({
      name: discount.description || `${discount.amount}${discount.type === 'percentage' ? '% off' : '$ off'}`,
      duration: 'once',
      ...(discount.type === 'percentage' 
        ? { percent_off: discount.amount }
        : { amount_off: Math.round(discount.amount * 100) }), // Convert to cents for fixed amounts
      max_redemptions: discount.max_uses,
      ...(discount.valid_until && { redeem_by: Math.floor(new Date(discount.valid_until).getTime() / 1000) })
    });

    return stripeCoupon.id;
  } catch (error) {
    console.error('Error syncing with Stripe:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const data: DiscountCreateRequest = await req.json();

    // Validate required fields
    if (!data.code || !data.type || typeof data.amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const { data: existingDiscount } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', data.code)
      .single();

    if (existingDiscount) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }

    // Create discount code object
    const newDiscount: Partial<DiscountCode> = {
      ...data,
      used_count: 0,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Sync with Stripe
    const stripeCouponId = await syncWithStripe(newDiscount as DiscountCode);
    if (stripeCouponId) {
      newDiscount.stripe_coupon_id = stripeCouponId;
    }

    // Save to database
    const { data: savedDiscount, error } = await supabase
      .from('discount_codes')
      .insert([newDiscount])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(savedDiscount);
  } catch (error: any) {
    console.error('Error creating discount:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create discount code' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { id, ...data }: DiscountUpdateRequest & { id: string } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing discount ID' },
        { status: 400 }
      );
    }

    // Get existing discount
    const { data: existingDiscount } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    // Update discount code
    const updatedDiscount: DiscountCode = {
      ...existingDiscount,
      ...data,
      updated_at: new Date().toISOString()
    };

    // Sync with Stripe if discount details changed
    if (data.type || data.amount || data.valid_until || data.max_uses) {
      const stripeCouponId = await syncWithStripe(updatedDiscount);
      if (stripeCouponId) {
        updatedDiscount.stripe_coupon_id = stripeCouponId;
      }
    }

    // Save to database
    const { data: savedDiscount, error } = await supabase
      .from('discount_codes')
      .update(updatedDiscount)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(savedDiscount);
  } catch (error: any) {
    console.error('Error updating discount:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update discount code' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    let query = supabase.from('discount_codes').select('*');
    
    if (code) {
      query = query.eq('code', code);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing discount ID' },
        { status: 400 }
      );
    }

    // Get existing discount
    const { data: existingDiscount } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    // Delete from Stripe if exists
    if (existingDiscount.stripe_coupon_id) {
      try {
        await stripe.coupons.del(existingDiscount.stripe_coupon_id);
      } catch (error) {
        console.error('Error deleting Stripe coupon:', error);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting discount:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete discount code' },
      { status: 500 }
    );
  }
} 