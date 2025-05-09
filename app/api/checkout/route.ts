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

async function getOrCreateCustomer(email: string, promoCodeId?: string): Promise<string> {
  try {
    // Check if customer exists
    const customers = await stripe.customers.list({ email });
    
    if (customers.data.length > 0) {
      const customer = customers.data[0];
      
      // If we have a promotion code, apply it to the existing customer
      if (promoCodeId) {
        // Apply promotion code through a new checkout session instead
        const tempSession = await stripe.checkout.sessions.create({
          customer: customer.id,
          payment_method_types: ['card'],
          line_items: [],
          mode: 'setup',
          discounts: [{ promotion_code: promoCodeId }]
        });
      }
      
      return customer.id;
    }

    // Create new customer
    const customer = await stripe.customers.create({ email });

    // If we have a promotion code, apply it through a session
    if (promoCodeId) {
      const tempSession = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [],
        mode: 'setup',
        discounts: [{ promotion_code: promoCodeId }]
      });
    }

    return customer.id;
  } catch (error) {
    console.error('Error getting/creating customer:', error);
    throw error;
  }
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

async function getStripePromoCode(coupon: Coupon): Promise<string | null> {
  try {
    // First check if we already have a promotion code stored
    if (coupon.stripe_coupon_id) {
      try {
        // If it's a promotion code, retrieve it directly
        if (coupon.stripe_coupon_id.startsWith('promo_')) {
          const promoCode = await stripe.promotionCodes.retrieve(coupon.stripe_coupon_id);
          if (promoCode.active && promoCode.coupon.valid) {
            return promoCode.id;
          }
        } else {
          // If it's a coupon ID, check if it's valid
          const stripeCoupon = await stripe.coupons.retrieve(coupon.stripe_coupon_id);
          if (stripeCoupon.valid) {
            // Create a new promotion code for this coupon
            const promoCode = await stripe.promotionCodes.create({
              coupon: stripeCoupon.id,
              code: coupon.code,
              metadata: {
                couponId: coupon.id,
                type: coupon.type,
                amount: coupon.amount.toString(),
                source: 'ProdAI Beats'
              }
            });
            
            // Update our database with the new promotion code ID
            const supabase = getSupabase();
            await supabase
              .from('coupons')
              .update({ stripe_coupon_id: promoCode.id })
              .eq('id', coupon.id);
              
            return promoCode.id;
          }
        }
      } catch (error) {
        console.error('Error retrieving existing promotion code:', error);
      }
    }

    // Create a new Stripe coupon
    const stripeCoupon = await stripe.coupons.create({
      name: coupon.code,
      duration: 'once',
      ...(coupon.type === 'percentage' 
        ? { percent_off: coupon.amount }
        : { amount_off: Math.round(coupon.amount * 100) }), // Convert to cents for fixed amounts
      max_redemptions: coupon.max_uses ?? undefined,
      ...(coupon.valid_until && { redeem_by: Math.floor(new Date(coupon.valid_until).getTime() / 1000) }),
      metadata: {
        couponId: coupon.id,
        type: coupon.type,
        amount: coupon.amount.toString(),
        source: 'ProdAI Beats'
      }
    });

    // Create a promotion code linked to the coupon
    const promoCode = await stripe.promotionCodes.create({
      coupon: stripeCoupon.id,
      code: coupon.code,
      metadata: {
        couponId: coupon.id,
        type: coupon.type,
        amount: coupon.amount.toString(),
        source: 'ProdAI Beats'
      }
    });

    // Store the promotion code ID in our database
    try {
      const supabase = getSupabase();
      await supabase
        .from('coupons')
        .update({ stripe_coupon_id: promoCode.id })
        .eq('id', coupon.id);
    } catch (error) {
      console.error('Failed to update promotion code ID in database:', error);
    }

    return promoCode.id;
  } catch (error) {
    console.error('Error getting/creating Stripe promotion code:', error);
    return null;
  }
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

    const { cart, email, discountCode } = body;
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

    // Get coupon if provided and sync with Stripe
    let appliedCoupon: Coupon | null = null;
    let stripePromoCodeId: string | undefined = undefined;
    
    if (discountCode) {
      appliedCoupon = await getValidCoupon(discountCode);
      if (appliedCoupon) {
        const promoId = await getStripePromoCode(appliedCoupon);
        if (promoId) {
          stripePromoCodeId = promoId;
          console.log('Stripe promotion code ID:', stripePromoCodeId);
        }
      }
    }

    // Get or create customer using email
    const customerId = await getOrCreateCustomer(email);
    if (!customerId) {
      throw new Error('Failed to create or retrieve customer');
    }

    const host = headersList.get('host') || '';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // Calculate line items with proper metadata
    const lineItems = cart.map((item: CartItem) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          description: `${item.licenseType} License${item.artist ? ` - ${item.artist}` : ''}`,
          images: item.coverUrl ? [item.coverUrl] : undefined,
          metadata: {
            itemId: item.id,
            licenseType: item.licenseType,
            originalPrice: item.price.toString()
          }
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: 1,
    }));

    // Calculate totals for metadata
    const totalBeforeDiscount = cart.reduce((sum: number, item: CartItem) => sum + (item.price * 100), 0);

    // Create checkout session with proper promotion code handling
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      customer: customerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: {
        userId: customerId,
        items: JSON.stringify(cart.map((item: CartItem) => ({
          id: item.id,
          title: item.title,
          licenseType: item.licenseType,
          originalPrice: item.price
        }))),
        totalBeforeDiscount: totalBeforeDiscount.toString(),
        discountCode: appliedCoupon?.code || '',
        discountId: appliedCoupon?.id || '',
        discountType: appliedCoupon?.type || '',
        discountAmount: appliedCoupon?.amount?.toString() || ''
      }
    };

    // Add promotion code if available
    if (stripePromoCodeId) {
      sessionConfig.discounts = [{ promotion_code: stripePromoCodeId }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
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