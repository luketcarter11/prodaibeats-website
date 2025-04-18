'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FaArrowLeft, FaCheck, FaExternalLinkAlt, FaServer, FaClock } from 'react-icons/fa'

export default function SetupGuidePage() {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})
  
  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }))
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/admin/tracks/guide" 
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Guide
        </Link>
        <h1 className="text-3xl font-bold text-white">Setup Guide</h1>
      </div>
      
      <div className="bg-zinc-900 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FaServer className="text-green-500" /> Server Setup
        </h2>
        <p className="text-zinc-300 mb-6">
          To use the YouTube Music automation system, your server needs to have the following software installed.
          Check each item off as you complete it.
        </p>
        
        <div className="space-y-6">
          {/* Python Installation */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-start gap-3">
              <button 
                onClick={() => toggleStep('python')}
                className={`flex-shrink-0 w-6 h-6 mt-1 rounded-full border ${
                  completedSteps['python'] 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-transparent border-zinc-600 text-transparent'
                } flex items-center justify-center`}
              >
                <FaCheck className="w-3 h-3" />
              </button>
              
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-white">Install Python 3.6+</h3>
                <p className="text-zinc-400 mt-1 mb-3">
                  Python is required to run yt-dlp, which downloads tracks from YouTube Music.
                </p>
                
                <div className="bg-zinc-900 p-3 rounded-md mt-2 overflow-x-auto">
                  <p className="text-white font-mono mb-2"># For Ubuntu/Debian:</p>
                  <code className="text-green-400 font-mono">sudo apt update && sudo apt install python3 python3-pip</code>
                  
                  <p className="text-white font-mono mt-4 mb-2"># For macOS (using Homebrew):</p>
                  <code className="text-green-400 font-mono">brew install python</code>
                  
                  <p className="text-white font-mono mt-4 mb-2"># Verify installation:</p>
                  <code className="text-green-400 font-mono">python3 --version</code>
                </div>
                
                <p className="text-zinc-400 mt-3">
                  Ensure the installed Python version is 3.6 or higher.
                </p>
              </div>
            </div>
          </div>
          
          {/* yt-dlp Installation */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-start gap-3">
              <button 
                onClick={() => toggleStep('ytdlp')}
                className={`flex-shrink-0 w-6 h-6 mt-1 rounded-full border ${
                  completedSteps['ytdlp'] 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-transparent border-zinc-600 text-transparent'
                } flex items-center justify-center`}
              >
                <FaCheck className="w-3 h-3" />
              </button>
              
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-white">Install yt-dlp</h3>
                <p className="text-zinc-400 mt-1 mb-3">
                  yt-dlp is an improved fork of youtube-dl that handles YouTube Music downloads.
                </p>
                
                <div className="bg-zinc-900 p-3 rounded-md mt-2 overflow-x-auto">
                  <p className="text-white font-mono mb-2"># Install using pip:</p>
                  <code className="text-green-400 font-mono">pip3 install --upgrade yt-dlp</code>
                  
                  <p className="text-white font-mono mt-4 mb-2"># Verify installation:</p>
                  <code className="text-green-400 font-mono">yt-dlp --version</code>
                </div>
                
                <p className="text-zinc-400 mt-3">
                  If you get a "command not found" error, you may need to add pip's bin directory to your PATH.
                </p>
              </div>
            </div>
          </div>
          
          {/* FFmpeg Installation */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-start gap-3">
              <button 
                onClick={() => toggleStep('ffmpeg')}
                className={`flex-shrink-0 w-6 h-6 mt-1 rounded-full border ${
                  completedSteps['ffmpeg'] 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-transparent border-zinc-600 text-transparent'
                } flex items-center justify-center`}
              >
                <FaCheck className="w-3 h-3" />
              </button>
              
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-white">Install FFmpeg</h3>
                <p className="text-zinc-400 mt-1 mb-3">
                  FFmpeg is required for audio processing and extraction.
                </p>
                
                <div className="bg-zinc-900 p-3 rounded-md mt-2 overflow-x-auto">
                  <p className="text-white font-mono mb-2"># For Ubuntu/Debian:</p>
                  <code className="text-green-400 font-mono">sudo apt install ffmpeg</code>
                  
                  <p className="text-white font-mono mt-4 mb-2"># For macOS (using Homebrew):</p>
                  <code className="text-green-400 font-mono">brew install ffmpeg</code>
                  
                  <p className="text-white font-mono mt-4 mb-2"># Verify installation:</p>
                  <code className="text-green-400 font-mono">ffmpeg -version</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FaClock className="text-blue-500" /> Cron Job Setup
        </h2>
        <p className="text-zinc-300 mb-6">
          Setting up a cron job is essential for automating the downloading of tracks from YouTube Music.
        </p>
        
        <div className="space-y-6">
          {/* Environment Variable Setup */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-start gap-3">
              <button 
                onClick={() => toggleStep('env')}
                className={`flex-shrink-0 w-6 h-6 mt-1 rounded-full border ${
                  completedSteps['env'] 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-transparent border-zinc-600 text-transparent'
                } flex items-center justify-center`}
              >
                <FaCheck className="w-3 h-3" />
              </button>
              
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-white">Add Secret Key to .env</h3>
                <p className="text-zinc-400 mt-1 mb-3">
                  For security, add a secret key to your environment variables.
                </p>
                
                <div className="bg-zinc-900 p-3 rounded-md mt-2 overflow-x-auto">
                  <p className="text-white font-mono mb-2"># Add this line to your .env file:</p>
                  <code className="text-green-400 font-mono">CRON_SECRET_KEY=your-random-secret-key</code>
                </div>
                
                <p className="text-zinc-400 mt-3">
                  Create a secure random string for your secret key. This prevents unauthorized access to your scheduler.
                </p>
              </div>
            </div>
          </div>
          
          {/* Cron-job.org Setup */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-start gap-3">
              <button 
                onClick={() => toggleStep('cronjob')}
                className={`flex-shrink-0 w-6 h-6 mt-1 rounded-full border ${
                  completedSteps['cronjob'] 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-transparent border-zinc-600 text-transparent'
                } flex items-center justify-center`}
              >
                <FaCheck className="w-3 h-3" />
              </button>
              
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-white">Set Up Cron Job</h3>
                <p className="text-zinc-400 mt-1 mb-3">
                  Use a service like cron-job.org to periodically trigger the scheduler.
                </p>
                
                <ol className="list-decimal pl-6 text-zinc-300 space-y-4">
                  <li>
                    Create an account at <a 
                      href="https://cron-job.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 inline-flex"
                    >
                      cron-job.org <FaExternalLinkAlt className="text-xs" />
                    </a>
                  </li>
                  <li>Click "Create cronjob" to add a new job</li>
                  <li>
                    Set the URL to:
                    <div className="bg-zinc-900 p-2 rounded-md mt-1 overflow-x-auto">
                      <code className="text-green-400 font-mono">https://your-website.com/api/cron/scheduler?key=your-random-secret-key</code>
                    </div>
                    <p className="text-zinc-400 mt-1 text-sm">
                      Replace <code className="bg-zinc-800 px-1 rounded text-xs">your-website.com</code> with your domain and 
                      <code className="bg-zinc-800 px-1 rounded text-xs ml-1">your-random-secret-key</code> with the secret key from your .env file.
                    </p>
                  </li>
                  <li>Schedule: Set to "Every 1 minute"</li>
                  <li>Save the cron job</li>
                </ol>
                
                <div className="mt-4 p-3 bg-amber-900/30 rounded-lg border border-amber-800">
                  <p className="text-amber-300">
                    <strong>Note:</strong> Your website needs to be publicly accessible for the cron job to work.
                    If you're developing locally, consider using a service like ngrok to expose your local server.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Testing Setup */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-start gap-3">
              <button 
                onClick={() => toggleStep('test')}
                className={`flex-shrink-0 w-6 h-6 mt-1 rounded-full border ${
                  completedSteps['test'] 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-transparent border-zinc-600 text-transparent'
                } flex items-center justify-center`}
              >
                <FaCheck className="w-3 h-3" />
              </button>
              
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-white">Test Your Setup</h3>
                <p className="text-zinc-400 mt-1 mb-3">
                  Verify that everything is working correctly.
                </p>
                
                <ol className="list-decimal pl-6 text-zinc-300 space-y-2">
                  <li>
                    Go to the <Link href="/admin/tracks/scheduler" className="text-purple-400 hover:text-purple-300">
                      Scheduler page
                    </Link>
                  </li>
                  <li>Add your desired YouTube Music channel or playlist</li>
                  <li>Click "Activate" to enable the scheduler</li>
                  <li>Use the "Run Now" button to test an immediate run</li>
                  <li>
                    Check the <Link href="/admin/tracks/history" className="text-purple-400 hover:text-purple-300">
                      Track Download History
                    </Link> to see if tracks are being downloaded
                  </li>
                </ol>
                
                <p className="text-zinc-400 mt-3">
                  If everything is set up correctly, the scheduler will automatically check for new tracks based on your settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <Link 
          href="/admin/tracks/guide"
          className="text-purple-400 hover:text-purple-300 flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Guide
        </Link>
        
        <Link 
          href="/admin/tracks/scheduler"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Go to Scheduler
        </Link>
      </div>
    </div>
  )
} 