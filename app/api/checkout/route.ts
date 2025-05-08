import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

interface CartItem {
  id: string;
  title: string;
  price: number;
  artist?: string;
  licenseType: string;
  coverUrl?: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const { cart, email, discountCode } = await req.json();
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

      // Apply discount
      const discountAmount = discount.type === 'percentage' 
        ? (total * discount.amount) / 100
        : discount.amount

      total = Math.max(0, total - discountAmount)
    }

    const line_items = cart.map((item: CartItem) => ({
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: email,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      discounts: discountCode ? [{ coupon: `COUPON_${discountCode}` }] : undefined,
      metadata: {
        items: JSON.stringify(cart.map((item: CartItem) => ({
          id: item.id,
          title: item.title,
          licenseType: item.licenseType
        }))),
        discountCode: discountCode || ''
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 