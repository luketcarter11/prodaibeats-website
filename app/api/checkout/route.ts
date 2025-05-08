import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Define the runtime configuration for edge compatibility
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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
    await stripe.customers.update(orderDetails.user_id, {
      metadata: {
        [`order_${order.id}`]: JSON.stringify(order)
      }
    });
  } catch (error) {
    console.error('Failed to store order metadata:', error);
  }

  return order;
}

async function getValidCoupon(code: string): Promise<Coupon | null> {
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
}

async function syncCouponWithStripe(coupon: Coupon): Promise<string> {
  try {
    // If coupon already has a Stripe ID, verify it exists
    if (coupon.stripe_coupon_id) {
      try {
        await stripe.coupons.retrieve(coupon.stripe_coupon_id);
        return coupon.stripe_coupon_id;
      } catch (error) {
        // Coupon doesn't exist in Stripe, continue to create new one
      }
    }

    // Create new coupon in Stripe
    const stripeCoupon = await stripe.coupons.create({
      id: `coupon_${coupon.id}`,
      name: coupon.description || `${coupon.amount}${coupon.type === 'percentage' ? '% off' : '$ off'}`,
      duration: 'once',
      ...(coupon.type === 'percentage' 
        ? { percent_off: coupon.amount }
        : { amount_off: Math.round(coupon.amount * 100) }), // Convert to cents for fixed amounts
      max_redemptions: coupon.max_uses,
      ...(coupon.valid_until && { redeem_by: Math.floor(new Date(coupon.valid_until).getTime() / 1000) })
    });

    // Update coupon in database with Stripe ID
    await supabase
      .from('coupons')
      .update({ stripe_coupon_id: stripeCoupon.id })
      .eq('id', coupon.id);

    return stripeCoupon.id;
  } catch (error) {
    console.error('Error syncing coupon with Stripe:', error);
    throw error;
  }
}

async function incrementCouponUsage(couponId: string): Promise<void> {
  await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });
}

// Handle POST requests
export async function POST(req: NextRequest) {
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
    
    // Validate required fields
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
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

    // Get the host from the headers
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // Handle discount code
    let stripeCouponId: string | undefined;
    let appliedCoupon: Coupon | null = null;
    if (discountCode) {
      appliedCoupon = await getValidCoupon(discountCode);
      if (appliedCoupon) {
        try {
          stripeCouponId = await syncCouponWithStripe(appliedCoupon);
        } catch (error) {
          console.error('Failed to sync coupon with Stripe:', error);
          // Continue without discount if syncing fails
        }
      }
    }

    // Create line items for Stripe
    const lineItems = cart.map((item: CartItem) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          description: `${item.licenseType} License${item.artist ? ` - ${item.artist}` : ''}`,
          images: item.coverUrl ? [item.coverUrl] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: 1,
    }));

    // Calculate total for metadata
    const total = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount, 0);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      ...(stripeCouponId && { discounts: [{ coupon: stripeCouponId }] }),
      metadata: {
        userId: userId || 'guest',
        items: JSON.stringify(cart.map((item: CartItem) => ({
          id: item.id,
          title: item.title,
          licenseType: item.licenseType,
          price: item.price
        }))),
        discountCode: discountCode || '',
        discountAmount: appliedCoupon ? appliedCoupon.amount.toString() : '0',
        discountType: appliedCoupon ? appliedCoupon.type : 'none',
        orderDate: new Date().toISOString(),
        totalBeforeDiscount: (total / 100).toString()
      },
    });

    // Increment coupon usage if successfully applied
    if (appliedCoupon) {
      await incrementCouponUsage(appliedCoupon.id);
    }

    // Store order details for each item in cart
    const orderPromises = cart.map((item: CartItem) => 
      storeOrder({
        user_id: userId || 'guest',
        track_id: item.id,
        track_name: item.title,
        license: item.licenseType,
        total_amount: item.price,
        discount: appliedCoupon ? (
          appliedCoupon.type === 'percentage' 
            ? (item.price * appliedCoupon.amount / 100)
            : appliedCoupon.amount / cart.length // Distribute fixed discount equally
        ) : 0,
        stripe_session_id: session.id
      })
    );

    // Store all orders in parallel
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

// Handle GET requests
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