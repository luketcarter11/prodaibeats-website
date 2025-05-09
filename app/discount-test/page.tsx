'use client'

import { useState } from 'react'
import { FaSpinner } from 'react-icons/fa'

export default function DiscountTestPage() {
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('10')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTest = async () => {
    if (!code || isLoading) return
    
    setIsLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          total: parseFloat(amount) 
        })
      })
      
      const data = await response.json()
      setResult(data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error occurred')
      }
    } catch (err: any) {
      console.error('Error testing discount code:', err)
      setError(err.message || 'Failed to test discount code')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-white mb-6">Discount Code API Test</h1>
      
      <div className="bg-zinc-900/80 rounded-xl p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-200 mb-1">
              Discount Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter discount code"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-200 mb-1">
              Order Total
            </label>
            <div className="flex items-center">
              <span className="bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-lg px-3 py-2 text-gray-400">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.50"
                step="0.01"
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-r-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <button
            onClick={handleTest}
            disabled={isLoading || !code}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Testing...
              </>
            ) : (
              'Test Discount Code'
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {result && (
        <div className="bg-zinc-900/80 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">API Response</h2>
          <pre className="bg-zinc-800 p-4 rounded-lg overflow-x-auto text-white">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 