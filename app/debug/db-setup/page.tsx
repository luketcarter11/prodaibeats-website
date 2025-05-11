'use client'

import { useState, useEffect } from 'react';

export default function DbSetupPage() {
  const [loading, setLoading] = useState(false);
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
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-zinc-900 rounded-lg my-8">
      <h1 className="text-2xl font-bold mb-6">Database Setup & Verification</h1>
      
      <div className="p-6 bg-amber-900/30 border border-amber-700 rounded-lg mb-8">
        <h2 className="text-xl font-semibold text-amber-400 mb-2">Authentication System Being Rebuilt</h2>
        <p className="text-gray-300">
          The authentication system is currently being rebuilt. This debug tool will be restored
          once the new authentication system is in place.
        </p>
      </div>
      
      <div className="mb-8 grid grid-cols-1 gap-6">
        <div className="p-4 bg-zinc-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Database Setup SQL</h2>
          <p className="text-gray-400 mb-4">
            This SQL will be updated when the new authentication system is implemented:
          </p>
          
          <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-96 mb-4">
            <pre className="text-sm text-blue-300">
              {sqlContent}
            </pre>
          </div>
          
          <div className="flex gap-4">
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
    </div>
  );
} 