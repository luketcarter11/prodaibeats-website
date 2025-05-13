export interface Order {
  id: string;          // UUID in database
  user_id: string;     // UUID in database
  track_id: string;    // UUID in database
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

// Always use the real endpoints, regardless of environment
// This will ensure we're always fetching from the database
const USE_TEST_ENDPOINT = false;

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
      
    console.log(`Fetching user orders from: ${endpoint}`);
    const response = await fetch(endpoint);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`);
    }
    const orders: Order[] = await response.json();
    console.log(`Fetched ${orders.length} orders for user ${userId}`);
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
      
    console.log(`Fetching all orders from: ${endpoint}`);
    const response = await fetch(endpoint);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch all orders: ${response.status} ${errorText}`);
    }
    const orders: Order[] = await response.json();
    console.log(`Fetched ${orders.length} total orders`);
    return orders;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
} 