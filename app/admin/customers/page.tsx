'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { FaSearch, FaSpinner, FaEye, FaDownload, FaFilter, FaSortAmountDown, FaEnvelope } from 'react-icons/fa'
import { format } from 'date-fns'
import { User } from '@supabase/supabase-js'

interface Customer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  created_at: string
  last_purchase_date?: string
  total_spent?: number
  order_count: number
  user_status: 'registered' | 'customer' | 'both'
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('last_purchase_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [exportLoading, setExportLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  
  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [customers, searchTerm])

  const fetchCustomers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch profiles for registered users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }
      
      // Get auth users data if possible
      let authUsers: User[] = []
      try {
        // Try to get auth users directly (requires service role key)
        const { data: authData } = await supabase.auth.admin.listUsers()
        if (authData?.users) {
          authUsers = authData.users
          console.log('Successfully retrieved auth users')
        }
      } catch (authError) {
        console.log('Unable to access auth.admin.listUsers, will use profiles data only')
      }
      
      // Get customer data from orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('user_id, customer_email, total_amount, order_date')
        .order('order_date', { ascending: false })

      if (orderError) throw orderError

      // Process to get unique customers with aggregated data
      const customerMap = new Map<string, Customer>()
      
      // First add all registered users from profiles and auth data
      const profiles = profilesData || []
      
      // Log debugging information
      console.log(`Retrieved ${profiles.length} profiles`)
      console.log(`Retrieved ${authUsers.length} auth users`)
      console.log(`Retrieved ${orderData.length} orders`)
      
      // If we have auth users data and profiles, use both
      if (authUsers.length > 0) {
        // If we have auth users data, use that as primary source and enhance with profiles
        authUsers.forEach(user => {
          if (!user.email) return
          
          // Find corresponding profile if exists
          const profile = profiles.find(p => p.id === user.id)
          
          customerMap.set(user.email, {
            id: user.id,
            email: user.email,
            first_name: profile?.full_name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: profile?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            created_at: user.created_at,
            order_count: 0,
            user_status: 'registered'
          })
        })
      }
      
      // Always process profiles data as well
      profiles.forEach(profile => {
        // Check if profile has email (from trigger)
        if (profile.email) {
          // Skip if already added from auth users
          if (customerMap.has(profile.email)) return
          
          customerMap.set(profile.email, {
            id: profile.id,
            email: profile.email,
            first_name: profile.full_name?.split(' ')[0] || '',
            last_name: profile.full_name?.split(' ').slice(1).join(' ') || '',
            created_at: profile.created_at,
            order_count: 0,
            user_status: 'registered'
          })
          return
        }
        
        // Fallback to orders for email if profile doesn't have it
        const userOrders = orderData.filter(order => order.user_id === profile.id)
        const userEmail = userOrders.length > 0 ? userOrders[0].customer_email : null
        
        if (!userEmail) {
          console.log(`Profile ${profile.id} doesn't have an email and no matching orders found`)
          return // Skip profiles without email
        }
        
        customerMap.set(userEmail, {
          id: profile.id,
          email: userEmail,
          first_name: profile.full_name?.split(' ')[0] || '',
          last_name: profile.full_name?.split(' ').slice(1).join(' ') || '',
          created_at: profile.created_at,
          order_count: 0,
          user_status: 'registered'
        })
      })
      
      // Then add/update with order data
      orderData.forEach(order => {
        if (!order.customer_email) return
        
        const email = order.customer_email
        const existingCustomer = customerMap.get(email)
        const orderDate = new Date(order.order_date)
        const orderAmount = order.total_amount || 0
        
        if (existingCustomer) {
          // Update existing customer
          existingCustomer.order_count += 1
          existingCustomer.total_spent = (existingCustomer.total_spent || 0) + orderAmount
          existingCustomer.user_status = 'both'
          
          // Update last purchase date if this order is more recent
          const existingDate = existingCustomer.last_purchase_date 
            ? new Date(existingCustomer.last_purchase_date) 
            : new Date(0)
            
          if (orderDate > existingDate) {
            existingCustomer.last_purchase_date = order.order_date
          }
        } else {
          // Create new customer from order data
          customerMap.set(email, {
            id: order.user_id || email,
            email: email,
            created_at: order.order_date, // Use first order date as created date
            last_purchase_date: order.order_date,
            total_spent: orderAmount,
            order_count: 1,
            user_status: 'customer'
          })
        }
      })
      
      const customerList = Array.from(customerMap.values())
      console.log(`Final customer count: ${customerList.length}`)
      setCustomers(customerList)
      setFilteredCustomers(customerList)
    } catch (err: any) {
      console.error('Error fetching customers:', err)
      setError(err.message || 'Failed to fetch customers')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...customers]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(customer => 
        customer.email.toLowerCase().includes(term) || 
        (customer.first_name && customer.first_name.toLowerCase().includes(term)) ||
        (customer.last_name && customer.last_name.toLowerCase().includes(term))
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortField) {
        case 'email':
          return sortDirection === 'asc' 
            ? a.email.localeCompare(b.email)
            : b.email.localeCompare(a.email)
          
        case 'created_at':
          const dateA = new Date(a.created_at || 0)
          const dateB = new Date(b.created_at || 0)
          return sortDirection === 'asc'
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime()
            
        case 'last_purchase_date':
          const lastPurchaseA = a.last_purchase_date ? new Date(a.last_purchase_date).getTime() : 0
          const lastPurchaseB = b.last_purchase_date ? new Date(b.last_purchase_date).getTime() : 0
          return sortDirection === 'asc'
            ? lastPurchaseA - lastPurchaseB
            : lastPurchaseB - lastPurchaseA
            
        case 'total_spent':
          const spentA = a.total_spent || 0
          const spentB = b.total_spent || 0
          return sortDirection === 'asc'
            ? spentA - spentB
            : spentB - spentA
            
        case 'order_count':
          return sortDirection === 'asc'
            ? a.order_count - b.order_count
            : b.order_count - a.order_count
            
        default:
          return 0
      }
    })

    setFilteredCustomers(result)
  }

  const handleSortChange = (field: string) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, set to desc by default
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleViewCustomer = (customerId: string) => {
    router.push(`/admin/customers/${customerId}`)
  }

  const handleSelectionChange = (customerId: string) => {
    setSelectedIds(prevIds => {
      if (prevIds.includes(customerId)) {
        return prevIds.filter(id => id !== customerId)
      } else {
        return [...prevIds, customerId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id))
    }
    setSelectAll(!selectAll)
  }

  const exportCustomerEmails = () => {
    setExportLoading(true)
    
    try {
      // Get selected customers or all filtered customers if none selected
      const customersToExport = selectedIds.length > 0
        ? filteredCustomers.filter(c => selectedIds.includes(c.id))
        : filteredCustomers
        
      // Create CSV content
      const csvContent = [
        // Header
        ['Email', 'First Name', 'Last Name', 'Created Date', 'Last Purchase', 'Total Spent', 'Order Count', 'Status'].join(','),
        // Data rows
        ...customersToExport.map(customer => [
          customer.email,
          customer.first_name || '',
          customer.last_name || '',
          customer.created_at,
          customer.last_purchase_date || '',
          customer.total_spent?.toFixed(2) || '0.00',
          customer.order_count,
          customer.user_status
        ].join(','))
      ].join('\n')
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `customers-export-${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Reset selection after export
      setSelectedIds([])
      setSelectAll(false)
    } catch (err) {
      console.error('Error exporting customers:', err)
      setError('Failed to export customer data')
    } finally {
      setExportLoading(false)
    }
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'both': 
        return 'bg-green-900/50 text-green-400'
      case 'customer': 
        return 'bg-yellow-900/50 text-yellow-400'
      case 'registered': 
        return 'bg-blue-900/50 text-blue-400'
      default:
        return 'bg-gray-900/50 text-gray-400'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Customers</h1>
        
        <div className="flex space-x-4">
          <button
            onClick={exportCustomerEmails}
            disabled={exportLoading || isLoading}
            className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 flex items-center space-x-2"
          >
            {exportLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FaDownload />
                <span>Export {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All'}</span>
              </>
            )}
          </button>
          
          <button 
            onClick={() => router.push('/admin/email-campaigns')}
            className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900 flex items-center space-x-2"
          >
            <FaEnvelope />
            <span>Email Campaigns</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-zinc-900/80 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Search */}
          <div className="w-full">
            <label htmlFor="search" className="block text-sm font-medium text-gray-200 mb-1">
              Search Customers
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email or name"
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchCustomers}
            className="bg-zinc-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-zinc-900/80 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Customer' : 'Customers'}
          {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin h-8 w-8 text-purple-500" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-4 pl-4">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 focus:ring-purple-500 text-purple-600"
                    />
                  </th>
                  <th 
                    className="pb-4 text-gray-400 font-medium cursor-pointer"
                    onClick={() => handleSortChange('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {sortField === 'email' && (
                        <FaSortAmountDown className={`ml-2 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="pb-4 text-gray-400 font-medium cursor-pointer"
                    onClick={() => handleSortChange('created_at')}
                  >
                    <div className="flex items-center">
                      Customer Since
                      {sortField === 'created_at' && (
                        <FaSortAmountDown className={`ml-2 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="pb-4 text-gray-400 font-medium cursor-pointer"
                    onClick={() => handleSortChange('last_purchase_date')}
                  >
                    <div className="flex items-center">
                      Last Purchase
                      {sortField === 'last_purchase_date' && (
                        <FaSortAmountDown className={`ml-2 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="pb-4 text-gray-400 font-medium cursor-pointer"
                    onClick={() => handleSortChange('total_spent')}
                  >
                    <div className="flex items-center">
                      Total Spent
                      {sortField === 'total_spent' && (
                        <FaSortAmountDown className={`ml-2 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="pb-4 text-gray-400 font-medium cursor-pointer"
                    onClick={() => handleSortChange('order_count')}
                  >
                    <div className="flex items-center">
                      Orders
                      {sortField === 'order_count' && (
                        <FaSortAmountDown className={`ml-2 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="pb-4 text-gray-400 font-medium">Status</th>
                  <th className="pb-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-white/5">
                    <td className="py-4 pl-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => handleSelectionChange(customer.id)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 focus:ring-purple-500 text-purple-600"
                      />
                    </td>
                    <td className="py-4 text-white">{customer.email}</td>
                    <td className="py-4 text-white">{formatDate(customer.created_at)}</td>
                    <td className="py-4 text-white">{formatDate(customer.last_purchase_date)}</td>
                    <td className="py-4 text-white">{formatCurrency(customer.total_spent)}</td>
                    <td className="py-4 text-white">{customer.order_count}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserStatusBadge(customer.user_status)}`}>
                        {customer.user_status === 'both' ? 'Active Customer' : 
                         customer.user_status === 'customer' ? 'Guest Checkout' : 'Registered'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleViewCustomer(customer.id)}
                          className="text-gray-400 hover:text-white"
                          aria-label="View Customer Details"
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
    </div>
  )
}
