'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa'
import { discountService } from '@/services/discountService'
import type { DiscountCode, DiscountCreateRequest } from '@/types/discount'

export default function DiscountCodesPage() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null)
  const [formData, setFormData] = useState<DiscountCreateRequest>({
    code: '',
    amount: 0,
    type: 'percentage',
    expires_at: new Date().toISOString().split('T')[0],
    active: true,
    usage_limit: null
  })

  useEffect(() => {
    loadDiscountCodes()
  }, [])

  const loadDiscountCodes = async () => {
    try {
      const codes = await discountService.getAllDiscountCodes()
      setDiscountCodes(codes)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isEditing && selectedCode) {
        const updated = await discountService.updateDiscountCode(selectedCode.id, formData)
        if (!updated) throw new Error('Failed to update discount code')
      } else {
        const created = await discountService.createDiscountCode(formData)
        if (!created) throw new Error('Failed to create discount code')
      }

      resetForm()
      await loadDiscountCodes()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return

    setIsLoading(true)
    setError(null)

    try {
      const success = await discountService.deleteDiscountCode(id)
      if (!success) throw new Error('Failed to delete discount code')
      await loadDiscountCodes()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (code: DiscountCode) => {
    setSelectedCode(code)
    setFormData({
      code: code.code,
      amount: code.amount,
      type: code.type,
      expires_at: code.expires_at?.split('T')[0] ?? '',
      active: code.active,
      usage_limit: code.usage_limit
    })
    setIsEditing(true)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      amount: 0,
      type: 'percentage',
      expires_at: new Date().toISOString().split('T')[0],
      active: true,
      usage_limit: null
    })
    setSelectedCode(null)
    setIsEditing(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Discount Codes</h1>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="bg-zinc-900/80 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-6">
          {isEditing ? 'Edit Discount Code' : 'Add New Discount Code'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-200 mb-1">
                Code
              </label>
              <input
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-200 mb-1">
                Amount
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  min="0"
                  step={formData.type === 'percentage' ? '1' : '0.01'}
                  max={formData.type === 'percentage' ? '100' : undefined}
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                  className="ml-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">$</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="expires_at" className="block text-sm font-medium text-gray-200 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                id="expires_at"
                value={formData.expires_at || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value || null }))}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-200 mb-1">
                Usage Limit (Optional)
              </label>
              <input
                type="number"
                id="usage_limit"
                value={formData.usage_limit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value ? parseInt(e.target.value) : null }))}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="form-checkbox h-4 w-4 text-purple-600 rounded border-zinc-700 bg-zinc-800 focus:ring-purple-500"
              />
              <span className="text-white">Active</span>
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Code' : 'Create Code'
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-transparent text-white border border-white/20 py-2 px-4 rounded-lg font-medium hover:bg-white/5"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Discount Codes List */}
      <div className="bg-zinc-900/80 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Active Discount Codes</h2>

        {isLoading && !discountCodes.length ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin h-8 w-8 text-purple-500" />
          </div>
        ) : discountCodes.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No discount codes found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-4 text-gray-400 font-medium">Code</th>
                  <th className="pb-4 text-gray-400 font-medium">Discount</th>
                  <th className="pb-4 text-gray-400 font-medium">Expiration</th>
                  <th className="pb-4 text-gray-400 font-medium">Uses</th>
                  <th className="pb-4 text-gray-400 font-medium">Status</th>
                  <th className="pb-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discountCodes.map((code) => (
                  <tr key={code.id} className="border-b border-white/5">
                    <td className="py-4 text-white">{code.code}</td>
                    <td className="py-4 text-white">
                      {code.type === 'percentage' ? `${code.amount}%` : `$${code.amount.toFixed(2)}`}
                    </td>
                    <td className="py-4 text-white">
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-4 text-white">
                      {code.used_count}{code.usage_limit ? `/${code.usage_limit}` : ''}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        code.active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {code.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(code)}
                          className="text-gray-400 hover:text-white"
                          aria-label="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label="Delete"
                        >
                          <FaTrash />
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