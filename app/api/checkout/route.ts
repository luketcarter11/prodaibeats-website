import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

// Define the orders directory path
const ORDERS_DIR = path.join(process.cwd(), 'data', 'orders');

// Ensure orders directory exists
if (!fs.existsSync(ORDERS_DIR)) {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

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

  // Store order in local file system
  const orderPath = path.join(ORDERS_DIR, `${order.id}.json`);
  fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));

  return order;
}

async function validateDiscountCode(code: string): Promise<{ 
  valid: boolean; 
  amount: number; 
  type: 'percentage' | 'fixed';
  code: string;
} | null> {
  // For now, return a fixed 10% discount for any code
  // You can implement more sophisticated discount validation later
  return code ? {
    valid: true,
    amount: 10,
    type: 'percentage',
    code
  } : null;
}

// Handle POST requests
export async function POST(req: Request) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    const body = await req.json();
    const { cart, email, discountCode, userId } = body;
    const headersList = headers();
    
    // Validate required fields
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: 'Invalid cart data' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Get the host from the headers
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // Calculate initial total
    let total = cart.reduce((sum: number, item: CartItem) => {
      return sum + (item.price * item.quantity)
    }, 0);

    // Validate discount code if provided
    let validatedDiscount = null;
    if (discountCode) {
      validatedDiscount = await validateDiscountCode(discountCode);
      
      if (validatedDiscount) {
        // Apply discount
        const discountAmount = validatedDiscount.type === 'percentage' 
          ? (total * validatedDiscount.amount) / 100
          : validatedDiscount.amount;

        total = Math.max(0, total - discountAmount);
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

    // Create Stripe checkout session
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
        discount: discountCode && validatedDiscount ? (item.price * validatedDiscount.amount) / 100 : 0,
        stripe_session_id: session.id
      })
    );

    // Store all orders in parallel
    await Promise.all(orderPromises);

    return NextResponse.json(
      { success: true, url: session.url },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An error occurred during checkout' 
      },
      { status: 500 }
    );
  }
}

// Handle GET requests
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method not allowed. Please use POST for checkout.' 
    },
    { status: 405 }
  );
}

// Handle other HTTP methods
export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
} 