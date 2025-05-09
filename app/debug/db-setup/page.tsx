'use client'

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function DbSetupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [sqlContent, setSqlContent] = useState('');
  
  useEffect(() => {
    // Fetch SQL content on mount
    fetch('/db/supabase-setup.sql')
      .then(response => response.text())
      .then(content => {
        setSqlContent(content);
      })
      .catch(error => {
        console.error('Error loading SQL file:', error);
        setSqlContent('Error loading SQL file. Please check console for details.');
      });
      
    // Run initial checks
    checkDbSetup();
  }, []);
  
  const checkDbSetup = async () => {
    setLoading(true);
    const checkResults: any = {};
    
    try {
      // Check if profiles table exists
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });
        
      checkResults.profiles = {
        exists: !profilesError,
        error: profilesError ? profilesError.message : null,
        count: profilesData?.length || 0
      };
      
      // Check if handle_new_user function exists
      try {
        const { data: functionData, error: functionError } = await supabase.rpc(
          'check_function_exists',
          { function_name: 'handle_new_user' }
        );
        
        checkResults.handleNewUserFunction = {
          exists: functionData?.exists || false,
          error: functionError ? functionError.message : null
        };
      } catch (error: any) {
        checkResults.handleNewUserFunction = {
          exists: false,
          error: error.message,
          hint: 'Function check_function_exists may not exist yet. Run the setup SQL first.'
        };
      }
      
      // Check RLS policies on profiles table
      try {
        const { data: policiesData, error: policiesError } = await supabase.rpc(
          'check_rls_policies',
          { table_name: 'profiles' }
        );
        
        checkResults.rlsPolicies = {
          success: !policiesError,
          error: policiesError ? policiesError.message : null,
          policies: policiesData || []
        };
      } catch (error: any) {
        checkResults.rlsPolicies = {
          success: false,
          error: error.message,
          hint: 'Function check_rls_policies may not exist yet. Run the setup SQL first.'
        };
      }
      
      setResults(checkResults);
    } catch (error: any) {
      console.error('Error checking DB setup:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const runSetupSql = async () => {
    setLoading(true);
    
    try {
      // We can't directly run SQL from client side, so show instructions
      alert('To run the SQL setup, copy the SQL content and run it in the Supabase SQL Editor.');
      
      // For demonstration only - this won't actually work from client side
      // In a real app, you would have a server endpoint to run this SQL
      setResults({
        ...results,
        setupInstructions: {
          message: 'Copy the SQL content and run it in the Supabase SQL Editor',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error in setup:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-zinc-900 rounded-lg my-8">
      <h1 className="text-2xl font-bold mb-6">Database Setup & Verification</h1>
      
      <div className="mb-8 grid grid-cols-1 gap-6">
        <div className="p-4 bg-zinc-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Check Database Setup</h2>
          <button
            onClick={checkDbSetup}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Run Checks'}
          </button>
          
          {Object.keys(results).length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Results:</h3>
              <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-60">
                <pre className="text-sm text-green-300">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-zinc-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Database Setup SQL</h2>
          <p className="text-gray-400 mb-4">
            Run this SQL in your Supabase SQL Editor to set up the database:
          </p>
          
          <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-96 mb-4">
            <pre className="text-sm text-blue-300">
              {sqlContent}
            </pre>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={runSetupSql}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Show Setup Instructions'}
            </button>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(sqlContent);
                alert('SQL copied to clipboard!');
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              Copy SQL to Clipboard
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
        
        <ol className="list-decimal pl-5 text-gray-300 space-y-3">
          <li>
            Run the SQL setup in your Supabase SQL Editor
          </li>
          <li>
            Use the "Run Checks" button to verify everything is set up correctly
          </li>
          <li>
            Test the auth flow by creating a new user and signing in
          </li>
          <li>
            Test the profile API by fetching and updating your profile
          </li>
        </ol>
      </div>
    </div>
  );
} 