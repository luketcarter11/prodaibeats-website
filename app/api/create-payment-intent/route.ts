import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret key and specify API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// Types for the request body
interface CartItem {
  id: string;
  title: string;
  price: number;
  licenseType: string;
  artist?: string;
}

interface RequestBody {
  items: CartItem[];
  email: string;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody;
    const { items, email, name } = body;

    // Validate required fields
    if (!items?.length) {
      return NextResponse.json(
        { error: 'Please provide items to purchase' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Please provide an email address' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Please provide a name' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Calculate the order amount from the items in the cart
    const amount = items.reduce(
      (total: number, item: CartItem) => total + (item.price * 100),
      0
    );

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount' },
        { status: 400 }
      );
    }

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
        items: JSON.stringify(items.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          licenseType: item.licenseType
        }))),
        orderCreatedAt: new Date().toISOString(),
      },
      receipt_email: email,
      description: `Purchase on ProdAI Beats - ${items.length} item(s)`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Payment intent creation failed:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your payment' },
      { status: 500 }
    );
  }
} 