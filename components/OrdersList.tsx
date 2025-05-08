'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserOrders, Order } from '../lib/getOrders';

interface OrdersListProps {
  userId: string;
}

const OrdersList: React.FC<OrdersListProps> = ({ userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        const result = await getUserOrders(userId);
        setOrders(result);
      } catch (err) {
        setError('Failed to load orders');
        console.error('Error loading orders:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-gray-800 text-white">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" />
          <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-.3s]" />
          <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-.5s]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-gray-800 text-white">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-gray-800 text-white">
      <h3 className="text-lg font-semibold mb-4">Licenses & Orders</h3>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-2">No licenses purchased yet</p>
          <p className="text-gray-500 mb-6">When you purchase beats with a license, they will appear here for easy access and download.</p>
          <Link
            href="/beats"
            className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Browse Beats
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 bg-gray-700 rounded-lg border border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{order.track_name}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                <div>
                  <p>License Type:</p>
                  <p className="text-white">{order.license}</p>
                </div>
                <div>
                  <p>Purchase Date:</p>
                  <p className="text-white">
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p>Amount Paid:</p>
                  <p className="text-white">
                    ${order.total_amount.toFixed(2)}
                    {order.discount && order.discount > 0 && (
                      <span className="text-green-400 ml-2">
                        (-${order.discount.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {order.status === 'completed' && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    onClick={() => window.open(`/api/download/${order.track_id}`, '_blank')}
                  >
                    Download Track
                  </button>
                  <button
                    className="flex-1 bg-transparent border border-purple-600 text-purple-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600/10 transition-colors"
                    onClick={() => window.open(`/api/license/${order.id}`, '_blank')}
                  >
                    View License
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList; 