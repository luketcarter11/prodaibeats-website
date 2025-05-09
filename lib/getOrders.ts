export interface Order {
  id: string;
  user_id: string;
  track_id: string;
  track_name: string;
  license: string;
  total_amount: number;
  discount?: number;
  order_date: string;
  status: 'pending' | 'completed' | 'failed';
  stripe_session_id?: string;
  customer_email?: string;
  created_at?: string;
  updated_at?: string;
  currency?: string;
  license_file?: string;
}

// Automatically use test endpoint in development and real endpoint in production
const USE_TEST_ENDPOINT = process.env.NODE_ENV === 'development';

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    // In case no userId is provided
    if (!userId) {
      console.warn('getUserOrders called without a userId');
      return [];
    }
    
    const endpoint = USE_TEST_ENDPOINT 
      ? `/api/test-orders?userId=${userId}`
      : `/api/orders?userId=${userId}`;
      
    const response = await fetch(endpoint);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`);
    }
    const orders: Order[] = await response.json();
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const endpoint = USE_TEST_ENDPOINT 
      ? `/api/test-orders?admin=true`
      : `/api/orders?admin=true`;
      
    const response = await fetch(endpoint);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch all orders: ${response.status} ${errorText}`);
    }
    const orders: Order[] = await response.json();
    return orders;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
} 