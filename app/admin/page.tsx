'use client'

import Link from 'next/link'
import { FaMusic, FaRobot, FaShoppingCart, FaCog, FaTag } from 'react-icons/fa'

const AdminDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Track Management */}
        <div className="bg-zinc-900/80 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <FaMusic className="text-purple-500 text-2xl mr-3" />
            <h2 className="text-xl font-bold text-white">Track Management</h2>
          </div>
          <p className="text-gray-400 mb-4">Add, manage, and organize your beat catalog.</p>
          <div className="space-y-2">
            <Link href="/admin/tracks/add" className="block text-purple-400 hover:text-purple-300">+ Add New Track Manually</Link>
            <Link href="/admin/tracks/youtube" className="block text-purple-400 hover:text-purple-300">+ Download from YouTube Music</Link>
            <Link href="/admin/tracks/import" className="block text-purple-400 hover:text-purple-300">Import Downloaded Tracks</Link>
            <Link href="/admin/tracks" className="block text-purple-400 hover:text-purple-300">Manage All Tracks</Link>
          </div>
        </div>

        {/* Automation */}
        <div className="bg-zinc-900/80 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <FaRobot className="text-purple-500 text-2xl mr-3" />
            <h2 className="text-xl font-bold text-white">Automation</h2>
          </div>
          <p className="text-gray-400 mb-4">Schedule automatic track downloads and manage history.</p>
          <div className="space-y-2">
            <Link href="/admin/automation/youtube" className="block text-purple-400 hover:text-purple-300">YouTube Music Scheduler</Link>
            <Link href="/admin/automation/history" className="block text-purple-400 hover:text-purple-300">Track Download History</Link>
            <Link href="/admin/automation/guide" className="block text-purple-400 hover:text-purple-300">Workflow Guide</Link>
          </div>
        </div>

        {/* Orders & Customers */}
        <div className="bg-zinc-900/80 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <FaShoppingCart className="text-purple-500 text-2xl mr-3" />
            <h2 className="text-xl font-bold text-white">Orders & Customers</h2>
          </div>
          <p className="text-gray-400 mb-4">View and manage orders and customer information.</p>
          <div className="space-y-2">
            <Link href="/admin/orders" className="block text-purple-400 hover:text-purple-300">View Orders</Link>
            <Link href="/admin/customers" className="block text-purple-400 hover:text-purple-300">Customer List</Link>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-zinc-900/80 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <FaCog className="text-purple-500 text-2xl mr-3" />
            <h2 className="text-xl font-bold text-white">Settings</h2>
          </div>
          <p className="text-gray-400 mb-4">Configure your store settings and preferences.</p>
          <div className="space-y-2">
            <Link href="/admin/settings" className="block text-purple-400 hover:text-purple-300">Store Settings (Coming Soon)</Link>
            <Link href="/admin/settings/payment" className="block text-purple-400 hover:text-purple-300">Payment Integration (Coming Soon)</Link>
          </div>
        </div>

        {/* Discount Codes */}
        <div className="bg-zinc-900/80 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <FaTag className="text-purple-500 text-2xl mr-3" />
            <h2 className="text-xl font-bold text-white">Discount Codes</h2>
          </div>
          <p className="text-gray-400 mb-4">Manage promotional discounts and coupon codes.</p>
          <div className="space-y-2">
            <Link href="/admin/discount-codes" className="block text-purple-400 hover:text-purple-300">Manage Discount Codes</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 