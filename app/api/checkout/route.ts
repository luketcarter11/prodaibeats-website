import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Edge and Streaming flags
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil'
});

// Initialize Supabase with runtime check
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};

interface CartItem {
  id: string;
  title: string;
  price: number;
  artist?: string;
  licenseType: string;
  coverUrl?: string;
  quantity: number;
}

interface Order {
  id: string;
  user_id: string;
  track_id: string;
  track_name: string;
  license: string;
  total_amount: number;
  discount?: number;
  order_date: string;
  status: 'pending' | 'completed' | 'failed';
  stripe_session_id: string;
}

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  amount: number;
  description?: string;
  valid_from: string;
  valid_until?: string;
  max_uses?: number;
  current_uses: number;
  stripe_coupon_id?: string;
}

interface LineItem {
  price_data: {
    currency: string;
    product_data: {
      name: string;
      description: string;
      images?: string[];
    };
    unit_amount: number;
  };
  quantity: number;
}

async function storeOrder(orderDetails: {
  user_id: string;
  track_id: string;
  track_name: string;
  license: string;
  total_amount: number;
  discount?: number;
  stripe_session_id: string;
}): Promise<Order> {
  const order: Order = {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...orderDetails,
    order_date: new Date().toISOString(),
    status: 'pending'
  };

  try {
    // Store order metadata in Stripe
    await stripe.customers.update(orderDetails.user_id, {
      metadata: {
        [`order_${order.id}`]: JSON.stringify({
          ...order,
          created_at: new Date().toISOString()
        })
      }
    });
  } catch (error) {
    console.error('Failed to store order metadata:', error);
  }

  return order;
}

async function getValidCoupon(code: string): Promise<Coupon | null> {
  try {
    const supabase = getSupabase();
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !coupon) {
      return null;
    }

    // Check if coupon is valid
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (
      now < validFrom ||
      (validUntil && now > validUntil) ||
      (coupon.max_uses && coupon.current_uses >= coupon.max_uses)
    ) {
      return null;
    }

    return coupon;
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return null;
  }
}

async function getStripeCoupon(coupon: Coupon): Promise<string | null> {
  try {
    // If we have a Stripe promotion ID stored, use it directly
    if (coupon.stripe_coupon_id && coupon.stripe_coupon_id.startsWith('promo_')) {
      return coupon.stripe_coupon_id;
    }

    // For legacy coupons or if no Stripe ID exists, create a new promotion
    const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const promotion = await stripe.promotionCodes.create({
      coupon: await createStripeCoupon(coupon),
      code: coupon.code,
      active: true,
      metadata: {
        couponId: coupon.id,
        type: coupon.type,
        amount: coupon.amount.toString()
      }
    });

    // Update coupon in Supabase with the promotion ID
    try {
      const supabase = getSupabase();
      await supabase
        .from('coupons')
        .update({ stripe_coupon_id: promotion.id })
        .eq('id', coupon.id);
    } catch (error) {
      console.error('Failed to update Stripe promotion ID in database:', error);
    }

    return promotion.id;
  } catch (error) {
    console.error('Error getting/creating Stripe promotion:', error);
    return null;
  }
}

async function createStripeCoupon(coupon: Coupon): Promise<string> {
  const stripeCoupon = await stripe.coupons.create({
    name: coupon.description || `${coupon.amount}${coupon.type === 'percentage' ? '% off' : '$ off'}`,
    duration: 'once',
    ...(coupon.type === 'percentage' 
      ? { percent_off: coupon.amount }
      : { amount_off: Math.round(coupon.amount * 100) }), // Convert to cents for fixed amounts
    max_redemptions: coupon.max_uses,
    ...(coupon.valid_until && { redeem_by: Math.floor(new Date(coupon.valid_until).getTime() / 1000) })
  });

  return stripeCoupon.id;
}

async function incrementCouponUsage(couponId: string): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });
  } catch (error) {
    console.error('Failed to increment coupon usage:', error);
  }
}

async function calculateDiscountedLineItems(
  cart: CartItem[], 
  appliedCoupon: Coupon | null
): Promise<LineItem[]> {
  return cart.map((item: CartItem) => {
    let finalPrice = item.price;
    
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        finalPrice = item.price * (1 - appliedCoupon.amount / 100);
      } else {
        // For fixed amount, distribute evenly across items
        finalPrice = Math.max(0, item.price - (appliedCoupon.amount / cart.length));
      }
    }

    // Ensure minimum price of $0.01 (1 cent)
    finalPrice = Math.max(0.01, finalPrice);

    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          description: `${item.licenseType} License${item.artist ? ` - ${item.artist}` : ''}${
            appliedCoupon ? ` (${appliedCoupon.amount}% off applied)` : ''
          }`,
          images: item.coverUrl ? [item.coverUrl] : undefined,
        },
        unit_amount: Math.round(finalPrice * 100), // Convert to cents
      },
      quantity: 1,
    };
  });
}

export async function POST(req: NextRequest) {
  // Verify Stripe key is available
  if (!process.env.STRIPE_SECRET_KEY) {
    return new NextResponse(
      JSON.stringify({ error: 'Stripe configuration missing' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (req.method !== 'POST') {
    return new NextResponse(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: {
          'Allow': 'POST',
          'Content-Type': 'application/json',
        }
      }
    );
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid JSON input' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!body) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { cart, email, discountCode, userId } = body;
    const headersList = headers();
    
    if (!cart?.length || !Array.isArray(cart)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid cart data' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!email) {
      return new NextResponse(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const host = headersList.get('host') || '';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // Get coupon if provided
    let appliedCoupon: Coupon | null = null;
    if (discountCode) {
      appliedCoupon = await getValidCoupon(discountCode);
      console.log('Applied coupon:', appliedCoupon); // Debug log
    }

    // Calculate line items with discounts applied directly
    const lineItems = await calculateDiscountedLineItems(cart, appliedCoupon);
    console.log('Line items:', lineItems); // Debug log

    // Calculate totals for metadata
    const totalBeforeDiscount = cart.reduce((sum, item) => sum + (item.price * 100), 0);
    const totalAfterDiscount = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount, 0);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: {
        userId: userId || 'guest',
        items: JSON.stringify(cart.map((item: CartItem) => ({
          id: item.id,
          title: item.title,
          licenseType: item.licenseType,
          originalPrice: item.price,
          finalPrice: item.price * (appliedCoupon ? (1 - appliedCoupon.amount / 100) : 1)
        }))),
        discountCode: appliedCoupon ? appliedCoupon.id : '',
        discountAmount: appliedCoupon ? appliedCoupon.amount.toString() : '0',
        discountType: appliedCoupon ? appliedCoupon.type : 'none',
        orderDate: new Date().toISOString(),
        totalBeforeDiscount: (totalBeforeDiscount / 100).toString(),
        totalAfterDiscount: (totalAfterDiscount / 100).toString()
      }
    });

    // Store order details
    const orderPromises = cart.map((item: CartItem) => {
      const finalPrice = appliedCoupon 
        ? (appliedCoupon.type === 'percentage'
          ? item.price * (1 - appliedCoupon.amount / 100)
          : item.price - (appliedCoupon.amount / cart.length))
        : item.price;

      return storeOrder({
        user_id: userId || 'guest',
        track_id: item.id,
        track_name: item.title,
        license: item.licenseType,
        total_amount: Math.max(0.01, finalPrice), // Ensure minimum price of $0.01
        discount: item.price - finalPrice,
        stripe_session_id: session.id
      }).catch(error => {
        console.error('Failed to store order:', error);
        return null;
      });
    });

    await Promise.all(orderPromises);

    return new NextResponse(
      JSON.stringify({ success: true, url: session.url }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred during checkout'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET(req: NextRequest) {
  return new NextResponse(
    JSON.stringify({ 
      success: false, 
      error: 'Method not allowed. Only POST requests are accepted.'
    }),
    { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'Content-Type': 'application/json'
      }
    }
  );
}

export function PUT() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}

export function PATCH() {
  return methodNotAllowed();
}

// Helper function for method not allowed response
function methodNotAllowed() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method not allowed. Only POST requests are accepted.' 
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST'
      }
    }
  );
} 