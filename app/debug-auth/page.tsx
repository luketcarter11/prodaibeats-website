'use client'

import { useState } from 'react'
import { supabase, withApiKey } from '../../lib/supabaseClient'

export default function DebugAuthPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<'signup' | 'signin'>('signup')
  
  // Test Supabase connection
  const testSupabaseConnection = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/debug-auth')
      const data = await response.json()
      setResult(data)
      console.log('Supabase connection test:', data)
    } catch (err) {
      console.error('Test error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  
  // Test JWT configuration
  const testJwtConfig = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/debug-jwt')
      const data = await response.json()
      setResult(data)
      console.log('JWT config test:', data)
    } catch (err) {
      console.error('JWT test error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  
  // Test authentication (signup or signin)
  const testAuthentication = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      let data, error
      
      // Use withApiKey to ensure API key is included in headers
      if (authMethod === 'signup') {
        const result = await withApiKey(async () => {
          return await supabase.auth.signUp({
            email,
            password,
          })
        })
        data = result.data
        error = result.error
      } else {
        const result = await withApiKey(async () => {
          return await supabase.auth.signInWithPassword({
            email,
            password,
          })
        })
        data = result.data
        error = result.error
      }
      
      if (error) {
        console.log('Auth error:', error)
        setError(error)
      } else {
        console.log('Auth result:', data)
        setResult(data)
      }
    } catch (err) {
      console.error('Auth test error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-zinc-900 rounded-lg my-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Auth Debugging</h1>
      
      <div className="mb-8 p-4 bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">1. Test Connection & Environment</h2>
        <div className="flex gap-4">
          <button
            onClick={testSupabaseConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Test Supabase Connection
          </button>
          
          <button
            onClick={testJwtConfig}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
          >
            Test JWT Configuration
          </button>
        </div>
      </div>
      
      <div className="mb-8 p-4 bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">2. Test Authentication</h2>
        
        <div className="mb-4">
          <div className="flex gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="authMethod"
                checked={authMethod === 'signup'}
                onChange={() => setAuthMethod('signup')}
                className="mr-2"
              />
              Sign Up
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="authMethod"
                checked={authMethod === 'signin'}
                onChange={() => setAuthMethod('signin')}
                className="mr-2"
              />
              Sign In
            </label>
          </div>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-700 text-white px-4 py-2 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-700 text-white px-4 py-2 rounded-lg"
              />
            </div>
          </div>
          
          <button
            onClick={testAuthentication}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Testing...' : `Test ${authMethod === 'signup' ? 'Sign Up' : 'Sign In'}`}
          </button>
        </div>
      </div>
      
      {/* Show Results */}
      <div className="p-4 bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        
        {loading && (
          <div className="text-gray-400">Loading...</div>
        )}
        
        {error && (
          <div className="mb-4">
            <h3 className="text-red-500 font-medium mb-2">Error:</h3>
            <pre className="bg-red-900/20 p-4 rounded-lg overflow-auto text-red-300 text-sm">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
        
        {result && (
          <div>
            <h3 className="text-green-500 font-medium mb-2">Success:</h3>
            <pre className="bg-green-900/20 p-4 rounded-lg overflow-auto text-green-300 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 