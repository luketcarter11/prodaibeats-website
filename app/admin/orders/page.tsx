'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FaSearch, FaSpinner, FaEye, FaFilter } from 'react-icons/fa'
import { format } from 'date-fns'

interface Order {
  id: string
  user_id: string
  order_date: string
  total_amount: number
  discount: number | null
  license: string
  track_name: string
  track_id: string | null
  license_file: string | null
  customer_email: string | null
  stripe_session_id: string | null
  created_at: string
  updated_at: string
  currency: string
  status: 'pending' | 'completed' | 'failed'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewingDetails, setIsViewingDetails] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [orders, searchTerm, statusFilter, dateFilter])

  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) {
        throw ordersError
      }

      setOrders(ordersData || [])
      setFilteredOrders(ordersData || [])
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to fetch orders')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...orders]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(order => 
        (order.customer_email && order.customer_email.toLowerCase().includes(term)) || 
        order.id.toLowerCase().includes(term) ||
        order.track_name.toLowerCase().includes(term) ||
        (order.license && order.license.toLowerCase().includes(term))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (dateFilter) {
        case 'today':
          result = result.filter(order => new Date(order.order_date) >= today)
          break
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          result = result.filter(order => new Date(order.order_date) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          result = result.filter(order => new Date(order.order_date) >= monthAgo)
          break
      }
    }

    setFilteredOrders(result)
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsViewingDetails(true)
  }

  const closeDetails = () => {
    setIsViewingDetails(false)
    setSelectedOrder(null)
  }

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/50 text-green-400'
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-400'
      case 'failed':
        return 'bg-red-900/50 text-red-400'
      default:
        return 'bg-gray-900/50 text-gray-400'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-6">Orders</h1>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-zinc-900/80 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Search */}
          <div className="w-full md:w-1/3">
            <label htmlFor="search" className="block text-sm font-medium text-gray-200 mb-1">
              Search Orders
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email, order ID, or track"
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-1/4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-200 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Date Filter */}
          <div className="w-full md:w-1/4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-200 mb-1">
              Time Period
            </label>
            <div className="relative">
              <select
                id="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchOrders}
            className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-zinc-900/80 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin h-8 w-8 text-purple-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-4 text-gray-400 font-medium">Order ID</th>
                  <th className="pb-4 text-gray-400 font-medium">Date</th>
                  <th className="pb-4 text-gray-400 font-medium">Customer</th>
                  <th className="pb-4 text-gray-400 font-medium">Track</th>
                  <th className="pb-4 text-gray-400 font-medium">License</th>
                  <th className="pb-4 text-gray-400 font-medium">Total</th>
                  <th className="pb-4 text-gray-400 font-medium">Status</th>
                  <th className="pb-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5">
                    <td className="py-4 text-white">{order.id.slice(0, 8)}...</td>
                    <td className="py-4 text-white">
                      {format(new Date(order.order_date), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4 text-white">{order.customer_email || 'Unknown'}</td>
                    <td className="py-4 text-white">
                      {order.track_name || 'Unknown Track'}
                    </td>
                    <td className="py-4 text-white">{order.license}</td>
                    <td className="py-4 text-white">
                      {formatCurrency(order.total_amount, order.currency)}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="text-gray-400 hover:text-white"
                          aria-label="View Details"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isViewingDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Order Details</h3>
                <button
                  onClick={closeDetails}
                  className="text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Order ID</h4>
                  <p className="text-white">{selectedOrder.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Order Date</h4>
                  <p className="text-white">
                    {format(new Date(selectedOrder.order_date), 'PPpp')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Customer</h4>
                  <p className="text-white">{selectedOrder.customer_email || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Status</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                {selectedOrder.stripe_session_id && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Stripe Session</h4>
                    <p className="text-white">{selectedOrder.stripe_session_id}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Created At</h4>
                  <p className="text-white">
                    {format(new Date(selectedOrder.created_at), 'PPpp')}
                  </p>
                </div>
              </div>
              
              <h4 className="text-lg font-medium text-white mb-4">Order Details</h4>
              <div className="bg-zinc-800 rounded-lg p-4 mb-6">
                <div className="mb-4 pb-4 border-b border-zinc-700">
                  <div className="flex justify-between">
                    <div>
                      <h5 className="text-white font-medium">{selectedOrder.track_name}</h5>
                      <p className="text-gray-400 text-sm">{selectedOrder.license} License</p>
                    </div>
                    <p className="text-white">
                      {formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}
                    </p>
                  </div>
                </div>

                {selectedOrder.license_file && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-400 mb-1">License File</h5>
                    <a 
                      href={selectedOrder.license_file} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      View License File
                    </a>
                  </div>
                )}

                {selectedOrder.track_id && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-400 mb-1">Track ID</h5>
                    <p className="text-white">{selectedOrder.track_id}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-white pt-4 border-t border-zinc-800">
                <span className="font-medium">Total</span>
                <span className="font-bold">
                  {formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}
                </span>
              </div>
              
              {selectedOrder.discount && selectedOrder.discount > 0 && (
                <div className="flex justify-between text-green-400 pt-2">
                  <span className="font-medium">Discount Applied</span>
                  <span className="font-bold">
                    -{formatCurrency(selectedOrder.discount, selectedOrder.currency)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-zinc-800">
              <button
                onClick={closeDetails}
                className="w-full bg-zinc-800 text-white py-2 px-4 rounded-lg font-medium hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
