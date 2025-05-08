import { NextRequest, NextResponse } from 'next/server';
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

// Define the runtime configuration for edge compatibility
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Handle POST requests
export async function POST(req: NextRequest) {
  // Ensure we're dealing with a POST request
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

// Handle all other HTTP methods
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