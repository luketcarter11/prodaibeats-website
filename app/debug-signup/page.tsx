'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function DebugSignupPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123456')
  const [name, setName] = useState('Test User')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<string>('check')
  const [checkResults, setCheckResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [directSignupResult, setDirectSignupResult] = useState<any>(null)
  const [apiSignupResult, setApiSignupResult] = useState<any>(null)
  
  // Check RLS and database setup
  const checkSetup = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug/rls')
      const data = await response.json()
      setCheckResults(data)
      console.log('Setup check results:', data)
      
      if (data.status === 'error') {
        setError(data.message)
      }
    } catch (err: any) {
      console.error('Check error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Test direct signup with Supabase client
  const testDirectSignup = async () => {
    setLoading(true)
    setError(null)
    setDirectSignupResult(null)
    
    try {
      // Test signup directly with Supabase client
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin + '/auth/callback',
        },
      })
      
      setDirectSignupResult({ data, error })
      console.log('Direct signup result:', { data, error })
      
      if (error) {
        setError(error.message)
      }
    } catch (err: any) {
      console.error('Direct signup error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Test signup through API route
  const testApiSignup = async () => {
    setLoading(true)
    setError(null)
    setApiSignupResult(null)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      })
      
      const result = await response.json()
      setApiSignupResult(result)
      console.log('API signup response:', response.status, result)
      
      if (!response.ok) {
        setError(result.message || 'API signup failed')
      }
    } catch (err: any) {
      console.error('API signup error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Run the setup check on mount
  useEffect(() => {
    checkSetup()
  }, [])
  
  // Helper to format JSON for display
  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2)
    } catch (e) {
      return 'Error formatting data'
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-zinc-900 rounded-lg my-8">
      <h1 className="text-2xl font-bold mb-6">Signup Debugging</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
          <h3 className="font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-8 p-4 bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">1. Test Account Details</h2>
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
            <label className="block text-sm text-gray-400 mb-1">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
      </div>
      
      <div className="mb-8 p-4 bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">2. System Check</h2>
        <p className="mb-4 text-gray-400">Check RLS policies and database setup</p>
        
        <button
          onClick={checkSetup}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 mb-4"
        >
          {loading ? 'Checking...' : 'Run System Check'}
        </button>
        
        {checkResults && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Check Results:</h3>
            <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-sm text-green-300 whitespace-pre-wrap break-all">
                {formatJson(checkResults)}
              </pre>
            </div>
            
            {checkResults.actions && checkResults.actions.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <h4 className="text-md font-semibold mb-2 text-yellow-300">Recommended Actions:</h4>
                <ul className="list-disc pl-5 text-yellow-100">
                  {checkResults.actions.map((action: any, index: number) => (
                    <li key={index} className="mb-2">
                      <p>{action.action}</p>
                      {action.sql && (
                        <pre className="text-xs bg-black/30 p-2 mt-1 rounded overflow-auto">
                          {action.sql}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-8 p-4 bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">3. Test Signup Methods</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 p-4 bg-zinc-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Direct Supabase Signup</h3>
            <p className="text-sm text-gray-400 mb-4">Test signup using Supabase client directly</p>
            
            <button
              onClick={testDirectSignup}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 mb-4"
            >
              {loading ? 'Testing...' : 'Test Direct Signup'}
            </button>
            
            {directSignupResult && (
              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">
                  Result: 
                  <span className={directSignupResult.error ? 'text-red-400 ml-2' : 'text-green-400 ml-2'}>
                    {directSignupResult.error ? 'Error' : 'Success'}
                  </span>
                </h4>
                <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-60">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                    {formatJson(directSignupResult)}
                  </pre>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4 bg-zinc-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">API Route Signup</h3>
            <p className="text-sm text-gray-400 mb-4">Test signup through server API route</p>
            
            <button
              onClick={testApiSignup}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 mb-4"
            >
              {loading ? 'Testing...' : 'Test API Signup'}
            </button>
            
            {apiSignupResult && (
              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">
                  Result: 
                  <span className={!apiSignupResult.success ? 'text-red-400 ml-2' : 'text-green-400 ml-2'}>
                    {!apiSignupResult.success ? 'Error' : 'Success'}
                  </span>
                </h4>
                <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-60">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                    {formatJson(apiSignupResult)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 