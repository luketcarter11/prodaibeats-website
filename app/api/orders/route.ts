import { NextResponse } from 'next/server';
import { Order } from '../../../lib/getOrders';

// This is a temporary solution - in production, you should use a proper database
const MOCK_ORDERS: Order[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Filter orders for the specific user and sort by date
    const userOrders = MOCK_ORDERS
      .filter(order => order.user_id === userId)
      .sort((a, b) => 
        new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      );

    return NextResponse.json(userOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 