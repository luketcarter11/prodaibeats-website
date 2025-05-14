'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserTransactions, Transaction } from '../lib/getOrders';
import { format } from 'date-fns';

interface OrdersListProps {
  userId: string;
}

const OrdersList: React.FC<OrdersListProps> = ({ userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getUserTransactions(userId);
        setTransactions(result);
      } catch (err) {
        setError('Failed to load transactions. Please try again later.');
        console.error('Error loading transactions:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-lg bg-[#111111] text-white">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.3s]" />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.5s]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-[#111111] text-white">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg bg-[#111111] text-white">
      <h2 className="text-xl font-semibold mb-6">Your Orders</h2>
      
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <svg className="mx-auto w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg text-gray-400 mb-2">No orders yet</p>
          <p className="text-gray-600 mb-8">When you purchase beats or tracks, they will appear here.</p>
          <Link
            href="/beats"
            className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg text-sm"
          >
            Browse Beats
          </Link>
        </div>
      ) :
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-4 bg-[#1A1A1A] rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{transaction.metadata?.track_name || 'Unknown Track'}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                <div>
                  <p>License Type:</p>
                  <p className="text-white">{transaction.license_type || 'N/A'}</p>
                </div>
                <div>
                  <p>Purchase Date:</p>
                  <p className="text-white">{formatDate(transaction.created_at)}</p>
                </div>
                <div>
                  <p>Amount Paid:</p>
                  <p className="text-white">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
                <div>
                  <p>Transaction ID:</p>
                  <p className="text-white">{transaction.id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
};

export default OrdersList; 