'use client'

import Link from 'next/link'

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#111111] rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Authentication System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            The authentication system is currently being rebuilt from scratch.
          </p>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded relative mt-4">
          <p className="block sm:inline">
            This page is a placeholder. The sign-in functionality will be implemented soon.
          </p>
        </div>
        
        <div className="mt-8">
          <Link 
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
          >
            Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  )
} 