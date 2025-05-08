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
  stripe_session_id: string;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const response = await fetch(`/api/orders?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    const orders: Order[] = await response.json();
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
} 