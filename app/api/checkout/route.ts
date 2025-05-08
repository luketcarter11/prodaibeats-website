import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface CartItem {
  id: string;
  title: string;
  price: number;
  artist?: string;
  licenseType: string;
  coverUrl?: string;
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
}) {
  const { data, error } = await supabaseClient
    .from('orders')
    .insert([{
      ...orderDetails,
      order_date: new Date().toISOString(),
      status: 'pending' // Will be updated to 'completed' after successful payment
    }])
    .select()
    .single();

  if (error) {
    console.error('Error storing order:', error);
    throw new Error(`Failed to store order: ${error.message}`);
  }

  return data;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, email, discountCode, userId } = body;
    const headersList = headers();
    
    // Get the host from the headers
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    if (!cart?.length) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate initial total
    let total = cart.reduce((sum: number, item: CartItem) => {
      return sum + (item.price * item.quantity)
    }, 0)

    // Validate discount code if provided
    let validatedDiscount = null;
    if (discountCode) {
      const { data: discount, error: discountError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode)
        .eq('active', true)
        .single()

      if (discountError || !discount) {
        return NextResponse.json(
          { error: 'Invalid or inactive discount code' },
          { status: 400 }
        )
      }

      // Check if code has expired
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'This discount code has expired' },
          { status: 400 }
        )
      }

      // Check usage limit
      if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
        return NextResponse.json(
          { error: 'This discount code has reached its usage limit' },
          { status: 400 }
        )
      }

      validatedDiscount = discount;

      // Apply discount
      const discountAmount = discount.type === 'percentage' 
        ? (total * discount.amount) / 100
        : discount.amount

      total = Math.max(0, total - discountAmount)
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      discounts: validatedDiscount ? [{ coupon: validatedDiscount.code }] : undefined,
      metadata: {
        userId: userId || 'guest',
        items: JSON.stringify(cart.map((item: CartItem) => ({
          id: item.id,
          title: item.title,
          licenseType: item.licenseType
        }))),
        discountCode: discountCode || ''
      },
    });

    // Store order details for each item in cart
    const orderPromises = cart.map((item: CartItem) => 
      storeOrder({
        user_id: userId || 'guest',
        track_id: item.id,
        track_name: item.title,
        license: item.licenseType,
        total_amount: item.price,
        discount: discountCode ? item.price * 0.1 : 0, // Example 10% discount
        stripe_session_id: session.id
      })
    );

    // Store all orders in parallel
    await Promise.all(orderPromises);

    // If successful, increment the usage count
    if (validatedDiscount) {
      await supabase.rpc('increment_discount_code_usage', {
        code_id: validatedDiscount.id
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 