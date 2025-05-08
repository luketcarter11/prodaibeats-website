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

    // Validate and get discount if provided
    let couponId: string | undefined;
    if (discountCode) {
      const { data: code, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode)
        .eq('isActive', true)
        .single();

      if (!error && code) {
        const now = new Date();
        const expirationDate = new Date(code.expiration);

        if (expirationDate > now && (!code.maxUses || code.currentUses < code.maxUses)) {
          couponId = `COUPON_${code.code}`;

          // Increment usage count
          await supabase
            .from('discount_codes')
            .update({ currentUses: code.currentUses + 1 })
            .eq('id', code.id);
        }
      }
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
      discounts: couponId ? [{ coupon: couponId }] : undefined,
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