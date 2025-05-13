// Set the runtime to edge for better performance
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { Order } from '../../../lib/getOrders';

// Generate UUID using Web Crypto API
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers (should never be needed in Edge Runtime)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Sample mock data for testing with proper UUIDs
const MOCK_ORDERS: Order[] = [
  {
    id: generateUUID(),
    user_id: generateUUID(),
    track_id: generateUUID(),
    track_name: 'Test Track 1',
    license: 'Non-Exclusive',
    order_date: new Date().toISOString(),
    total_amount: 29.99,
    discount: 0,
    license_file: undefined,
    customer_email: 'test1@example.com',
    stripe_session_id: 'cs_test_' + generateUUID(),
    currency: 'USD',
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    track_id: generateUUID(),
    track_name: 'Test Track 2',
    license: 'Exclusive',
    order_date: new Date().toISOString(),
    total_amount: 299.99,
    discount: 50,
    license_file: 'test-license.pdf',
    customer_email: 'test2@example.com',
    stripe_session_id: 'cs_test_' + generateUUID(),
    currency: 'USD',
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function GET() {
  return NextResponse.json(MOCK_ORDERS);
} 