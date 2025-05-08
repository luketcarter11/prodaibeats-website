import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, email, name } = body;

    if (!items || !items.length) {
      return NextResponse.json(
        { error: 'Please provide items to purchase' },
        { status: 400 }
      );
    }

    // Calculate the order amount from the items in the cart
    const amount = items.reduce(
      (total: number, item: any) => total + (item.price || 0) * 100,
      0
    );

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe expects amounts in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        email,
        name,
        items: JSON.stringify(items.map((item: any) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          licenseType: item.licenseType
        })))
      },
      receipt_email: email,
      description: `Purchase on ProdAI Beats - ${items.length} item(s)`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Payment intent creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred creating the payment' },
      { status: 500 }
    );
  }
} 