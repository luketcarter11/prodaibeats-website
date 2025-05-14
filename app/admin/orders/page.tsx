'use client'

import { useState, useEffect } from 'react'
import { FaSearch, FaSpinner, FaEye, FaFilter } from 'react-icons/fa'
import { format } from 'date-fns'
import { Transaction, getAllTransactions } from '../../../lib/getOrders'

export default function OrdersPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isViewingDetails, setIsViewingDetails] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [transactions, searchTerm, statusFilter, dateFilter])

  const fetchTransactions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const transactionsData = await getAllTransactions()
      setTransactions(transactionsData || [])
      setFilteredTransactions(transactionsData || [])
    } catch (err: any) {
      console.error('Error fetching transactions:', err)
      setError(err.message || 'Failed to fetch transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...transactions]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(transaction => 
        (transaction.customer_email && transaction.customer_email.toLowerCase().includes(term)) || 
        transaction.id.toLowerCase().includes(term) ||
        (transaction.metadata?.track_name && transaction.metadata.track_name.toLowerCase().includes(term)) ||
        (transaction.license_type && transaction.license_type.toLowerCase().includes(term))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(transaction => transaction.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (dateFilter) {
        case 'today':
          result = result.filter(transaction => new Date(transaction.created_at) >= today)
          break
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          result = result.filter(transaction => new Date(transaction.created_at) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          result = result.filter(transaction => new Date(transaction.created_at) >= monthAgo)
          break
      }
    }

    setFilteredTransactions(result)
  }

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsViewingDetails(true)
  }

  const closeDetails = () => {
    setIsViewingDetails(false)
    setSelectedTransaction(null)
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

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  }

  const formatDateTimeSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-6">Transactions</h1>

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
              Search Transactions
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email, transaction ID, or track"
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
            onClick={fetchTransactions}
            className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-zinc-900/80 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          {filteredTransactions.length} {filteredTransactions.length === 1 ? 'Transaction' : 'Transactions'}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin h-8 w-8 text-purple-500" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-4 text-gray-400 font-medium">Transaction ID</th>
                  <th className="pb-4 text-gray-400 font-medium">Date</th>
                  <th className="pb-4 text-gray-400 font-medium">Customer</th>
                  <th className="pb-4 text-gray-400 font-medium">Track</th>
                  <th className="pb-4 text-gray-400 font-medium">License</th>
                  <th className="pb-4 text-gray-400 font-medium">Amount</th>
                  <th className="pb-4 text-gray-400 font-medium">Status</th>
                  <th className="pb-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/5">
                    <td className="py-4 text-white">{transaction.id.slice(0, 8)}...</td>
                    <td className="py-4 text-white">
                      {formatDateSafe(transaction.created_at)}
                    </td>
                    <td className="py-4 text-white">{transaction.customer_email || 'Unknown'}</td>
                    <td className="py-4 text-white">
                      {transaction.metadata?.track_name || 'Unknown Track'}
                    </td>
                    <td className="py-4 text-white">{transaction.license_type || 'N/A'}</td>
                    <td className="py-4 text-white">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleViewDetails(transaction)}
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

      {/* Transaction Details Modal */}
      {isViewingDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Transaction Details</h3>
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
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Transaction ID</h4>
                  <p className="text-white">{selectedTransaction.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Transaction Date</h4>
                  <p className="text-white">
                    {formatDateTimeSafe(selectedTransaction.created_at)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Customer</h4>
                  <p className="text-white">{selectedTransaction.customer_email || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Status</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedTransaction.status)}`}>
                    {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                  </span>
                </div>
                {selectedTransaction.stripe_transaction_id && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Stripe Transaction</h4>
                    <p className="text-white">{selectedTransaction.stripe_transaction_id}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Created At</h4>
                  <p className="text-white">
                    {formatDateTimeSafe(selectedTransaction.created_at)}
                  </p>
                </div>
              </div>
              
              <h4 className="text-lg font-medium text-white mb-4">Transaction Details</h4>
              <div className="bg-zinc-800 rounded-lg p-4 mb-6">
                <div className="mb-4 pb-4 border-b border-zinc-700">
                  <div className="flex justify-between">
                    <div>
                      <h5 className="text-white font-medium">{selectedTransaction.metadata?.track_name || 'Unknown Track'}</h5>
                      <p className="text-gray-400 text-sm">{selectedTransaction.license_type || 'No License'} License</p>
                    </div>
                    <p className="text-white">
                      {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                    </p>
                  </div>
                </div>

                {selectedTransaction.metadata?.license_file && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-400 mb-1">License File</h5>
                    <a 
                      href={selectedTransaction.metadata.license_file} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      View License File
                    </a>
                  </div>
                )}

                {selectedTransaction.metadata?.track_id && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-400 mb-1">Track ID</h5>
                    <p className="text-white">{selectedTransaction.metadata.track_id}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-white pt-4 border-t border-zinc-800">
                <span className="font-medium">Total</span>
                <span className="font-bold">
                  {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                </span>
              </div>
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
