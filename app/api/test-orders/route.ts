// Import the runtime config
export { runtime } from '../config';

import { NextResponse } from 'next/server';
import { Order } from '../../../lib/getOrders';

// Sample mock data for testing
const MOCK_ORDERS: Order[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: 'user123',
    track_id: 'track1',
    track_name: 'Summer Vibes',
    license: 'Non-Exclusive',
    total_amount: 29.99,
    discount: 5.00,
    order_date: new Date().toISOString(),
    status: 'completed',
    stripe_session_id: 'cs_test_123456789',
    customer_email: 'user@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: 'USD'
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    user_id: 'user456',
    track_id: 'track2',
    track_name: 'Winter Beats',
    license: 'Exclusive',
    total_amount: 149.99,
    order_date: new Date().toISOString(),
    status: 'pending',
    stripe_session_id: 'cs_test_987654321',
    customer_email: 'otheruser@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: 'USD'
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    user_id: 'user123',
    track_id: 'track3',
    track_name: 'Hip Hop Classic',
    license: 'Non-Exclusive Plus',
    total_amount: 49.99,
    order_date: new Date().toISOString(),
    status: 'completed',
    stripe_session_id: 'cs_test_555555555',
    customer_email: 'user@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: 'USD'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('admin') === 'true';

    // For admin, return all orders
    if (isAdmin) {
      return NextResponse.json(MOCK_ORDERS);
    }

    // For regular users, return only their orders
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Filter orders for the specific user
    const userOrders = MOCK_ORDERS
      .filter(order => order.user_id === userId)
      .sort((a, b) => 
        new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      );

    return NextResponse.json(userOrders);
  } catch (error) {
    console.error('Error in test orders API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test orders' },
      { status: 500 }
    );
  }
} 