'use client'

import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <Link 
          href="/" 
          className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
        >
          Back to Site
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-900 rounded-xl p-6 hover:bg-zinc-800/80 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">Track Management</h2>
          <p className="text-zinc-400 mb-4">Add, manage, and organize your beat catalog.</p>
          <div className="flex flex-col gap-2">
            <Link 
              href="/admin/tracks/add" 
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              + Add New Track Manually
            </Link>
            <Link 
              href="/admin/tracks/youtube" 
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              + Download from YouTube Music
            </Link>
            <Link 
              href="/admin/tracks/import" 
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              Import Downloaded Tracks
            </Link>
            <Link 
              href="/admin/tracks/manage" 
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              Manage All Tracks
            </Link>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-6 hover:bg-zinc-800/80 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">Automation</h2>
          <p className="text-zinc-400 mb-4">Schedule automatic track downloads and manage history.</p>
          <div className="flex flex-col gap-2">
            <Link 
              href="/admin/tracks/scheduler" 
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              YouTube Music Scheduler
            </Link>
            <Link 
              href="/admin/tracks/history" 
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              Track Download History
            </Link>
            <Link 
              href="/admin/tracks/guide" 
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              Workflow Guide
            </Link>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-6 hover:bg-zinc-800/80 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">Orders & Customers</h2>
          <p className="text-zinc-400 mb-4">View and manage orders and customer information.</p>
          <div className="flex flex-col gap-2">
            <Link 
              href="#" 
              className="text-zinc-500 cursor-not-allowed flex items-center gap-2"
            >
              View Orders (Coming Soon)
            </Link>
            <Link 
              href="#" 
              className="text-zinc-500 cursor-not-allowed flex items-center gap-2"
            >
              Customer List (Coming Soon)
            </Link>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-6 hover:bg-zinc-800/80 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">Settings</h2>
          <p className="text-zinc-400 mb-4">Configure your store settings and preferences.</p>
          <div className="flex flex-col gap-2">
            <Link 
              href="#" 
              className="text-zinc-500 cursor-not-allowed flex items-center gap-2"
            >
              Store Settings (Coming Soon)
            </Link>
            <Link 
              href="#" 
              className="text-zinc-500 cursor-not-allowed flex items-center gap-2"
            >
              Payment Integration (Coming Soon)
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Server Requirements</h2>
          <div className="text-gray-400 space-y-2">
            <p>Make sure your server has the following installed:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Python 3.6+</li>
              <li>yt-dlp (<code className="bg-zinc-700 px-1 rounded">pip install yt-dlp</code>)</li>
              <li>FFmpeg (<code className="bg-zinc-700 px-1 rounded">sudo apt install ffmpeg</code>)</li>
            </ul>
            <p className="mt-4">These are required for downloading and processing YouTube videos.</p>
            <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700 rounded-md">
              <p className="font-medium text-amber-200">Important Note:</p>
              <p className="text-amber-200 text-sm mt-1">Make sure the server is running before using the track management tools. Use <code className="bg-zinc-700 px-1 rounded">npm run dev</code> to start the development server.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Documentation</h2>
          <div className="text-gray-400 space-y-2">
            <p className="font-medium text-white">yt-dlp Usage:</p>
            <p>
              The system uses yt-dlp to extract audio, thumbnails, and metadata from YouTube Music.
            </p>
            <p className="mt-4 font-medium text-white">Track Metadata:</p>
            <p>
              You'll need to manually input BPM and musical key as these can't be extracted automatically.
            </p>
            <p className="mt-4 font-medium text-white">Local Tracks:</p>
            <p>
              Use the Manage Tracks page to scan your local filesystem and update your site's tracklist automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 