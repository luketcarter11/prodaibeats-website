'use client'

import Link from 'next/link'
import { FaArrowLeft, FaYoutube, FaClock, FaTasks, FaCog, FaServer, FaFileAlt } from 'react-icons/fa'

export default function WorkflowGuidePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/admin" 
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-white">YouTube Music Automation Guide</h1>
      </div>
      
      <div className="bg-zinc-900 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FaYoutube className="text-red-500" /> Getting Started
        </h2>
        <div className="text-zinc-300 space-y-4">
          <p>
            This guide will help you set up the automated system to download tracks from your YouTube Music
            profile and publish them to your website. The system can automatically check your favorite channels
            and playlists for new uploads and download them for you.
          </p>
          
          <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-800">
            <h3 className="text-lg font-medium text-white mb-2">Prerequisites</h3>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300">
              <li>
                Server with Node.js, Python 3.6+, yt-dlp, and FFmpeg installed
              </li>
              <li>
                YouTube Music profile with channels or playlists you want to monitor
              </li>
              <li>
                Cron job service like <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">cron-job.org</a> or server crontab access
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaTasks className="text-green-500" /> Step 1: Configure Your Track Sources
          </h2>
          <div className="text-zinc-300 space-y-4">
            <p>
              First, you need to set up the YouTube Music channels and playlists you want to monitor for new tracks.
            </p>
            
            <ol className="list-decimal pl-6 space-y-4">
              <li>
                <strong className="text-white">Find YouTube Music channels or playlists</strong> that you want to track.
                These could be your own uploads, your favorite artists, or curated playlists.
              </li>
              <li>
                <strong className="text-white">Copy the URL</strong> of each channel or playlist. For example:
                <ul className="list-disc pl-8 mt-2 text-zinc-400">
                  <li>Channel: <code className="bg-zinc-800 px-2 py-1 rounded">https://music.youtube.com/channel/UC...</code></li>
                  <li>Playlist: <code className="bg-zinc-800 px-2 py-1 rounded">https://music.youtube.com/playlist?list=...</code></li>
                </ul>
              </li>
              <li>
                <strong className="text-white">Go to the Scheduler page</strong>: <Link href="/admin/tracks/scheduler" className="text-purple-400 hover:text-purple-300">YouTube Music Scheduler</Link>
              </li>
              <li>
                <strong className="text-white">Add your sources</strong> by pasting the URLs and selecting the type (channel or playlist).
              </li>
              <li>
                <strong className="text-white">Activate the scheduler</strong> by clicking the "Activate" button at the top of the page.
              </li>
            </ol>
            
            <div className="p-4 bg-blue-900/30 rounded-lg mt-4">
              <p className="text-blue-300">
                <strong>Tip:</strong> You can add multiple sources to track different artists or playlists simultaneously.
                The scheduler will check each active source for new tracks.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaClock className="text-blue-500" /> Step 2: Set Up Cron Job
          </h2>
          <div className="text-zinc-300 space-y-4">
            <p>
              To make the automation work, you need to set up a cron job that periodically triggers the scheduler.
              This ensures new tracks are downloaded automatically.
            </p>
            
            <h3 className="text-lg font-medium text-white mt-4">Option 1: Using cron-job.org (Recommended)</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Create a free account at <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">cron-job.org</a></li>
              <li>Add a new cronjob with the following URL:
                <div className="bg-zinc-800 p-3 rounded-lg mt-2 overflow-x-auto">
                  <code>https://your-website.com/api/cron/scheduler</code>
                </div>
              </li>
              <li>Set the execution schedule to "Every 1 minute"</li>
              <li>Save the cron job</li>
            </ol>
            
            <h3 className="text-lg font-medium text-white mt-4">Option 2: Using Server Crontab</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>SSH into your server</li>
              <li>Edit the crontab file:
                <div className="bg-zinc-800 p-3 rounded-lg mt-2">
                  <code>crontab -e</code>
                </div>
              </li>
              <li>Add the following line to run the curl command every minute:
                <div className="bg-zinc-800 p-3 rounded-lg mt-2 overflow-x-auto">
                  <code>* * * * * curl -s https://your-website.com/api/cron/scheduler &gt; /dev/null 2&gt;&1</code>
                </div>
              </li>
              <li>Save and exit the editor</li>
            </ol>
            
            <div className="p-4 bg-amber-900/30 rounded-lg mt-4 border border-amber-800">
              <p className="text-amber-300">
                <strong>Security Note:</strong> For additional security, create a secret key by adding <code className="bg-zinc-800 px-1 rounded">CRON_SECRET_KEY=your-secret-key</code> 
                to your <code className="bg-zinc-800 px-1 rounded">.env</code> file, then update your cron job URL to 
                <code className="bg-zinc-800 px-1 ml-1 rounded">https://your-website.com/api/cron/scheduler?key=your-secret-key</code>
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaCog className="text-yellow-500" /> Step 3: Customize Scheduler Settings
          </h2>
          <div className="text-zinc-300 space-y-4">
            <p>
              The scheduler is set to run every 24 hours by default, but you can customize various settings to suit your needs.
            </p>
            
            <h3 className="text-lg font-medium text-white">Key Customizations:</h3>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-white">Check Frequency</strong>: By default, the scheduler checks for new tracks every 24 hours.
                You can modify this in the <code className="bg-zinc-800 px-1 rounded">src/lib/models/Scheduler.ts</code> file.
              </li>
              <li>
                <strong className="text-white">Default Track Price</strong>: All imported tracks default to $12.99. You can change this in 
                <code className="bg-zinc-800 px-1 rounded">src/lib/YouTubeDownloader.ts</code>.
              </li>
              <li>
                <strong className="text-white">License Type</strong>: All tracks default to "Non-Exclusive" license. Modify this in the same file.
              </li>
            </ul>
            
            <div className="p-4 bg-blue-900/30 rounded-lg mt-4">
              <p className="text-blue-300">
                <strong>Tip:</strong> You can manually run the scheduler anytime by clicking the "Run Now" button on the Scheduler page.
                This is useful for testing or when you want to immediately check for new tracks.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaFileAlt className="text-purple-500" /> Step 4: Monitor & Manage Downloads
          </h2>
          <div className="text-zinc-300 space-y-4">
            <p>
              Once your automation is set up, you'll want to monitor the downloads and manage your track metadata.
            </p>
            
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                <strong className="text-white">Check Download History</strong>: Visit the <Link href="/admin/tracks/history" className="text-purple-400 hover:text-purple-300">Track Download History</Link> page
                to see all downloaded tracks, their sources, and when they were downloaded.
              </li>
              <li>
                <strong className="text-white">Update Track Metadata</strong>: After tracks are downloaded, you'll need to update their BPM and Musical Key.
                Go to <Link href="/admin/tracks/import" className="text-purple-400 hover:text-purple-300">Import Tracks</Link> to add this information.
              </li>
              <li>
                <strong className="text-white">Manage All Tracks</strong>: Use the <Link href="/admin/tracks/manage" className="text-purple-400 hover:text-purple-300">Manage Tracks</Link> page
                to edit existing tracks, update prices, or change metadata.
              </li>
            </ol>
            
            <div className="p-4 bg-amber-900/30 rounded-lg mt-4 border border-amber-800">
              <p className="text-amber-300">
                <strong>Important:</strong> The system only downloads metadata, audio, and cover images. You must manually add the BPM and musical key 
                for each track before it appears on your website. This information cannot be automatically extracted from YouTube Music.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaServer className="text-red-500" /> Server Requirements & Troubleshooting
          </h2>
          <div className="text-zinc-300 space-y-4">
            <h3 className="text-lg font-medium text-white">Required Software:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Python 3.6+</strong>: Required to run yt-dlp
                <div className="text-zinc-400 mt-1">Installation: <code className="bg-zinc-800 px-1 rounded">sudo apt update && sudo apt install python3 python3-pip</code></div>
              </li>
              <li>
                <strong className="text-white">yt-dlp</strong>: YouTube downloader tool
                <div className="text-zinc-400 mt-1">Installation: <code className="bg-zinc-800 px-1 rounded">pip3 install --upgrade yt-dlp</code></div>
              </li>
              <li>
                <strong className="text-white">FFmpeg</strong>: Audio/video processing
                <div className="text-zinc-400 mt-1">Installation: <code className="bg-zinc-800 px-1 rounded">sudo apt install ffmpeg</code></div>
              </li>
            </ul>
            
            <h3 className="text-lg font-medium text-white mt-6">Common Issues & Solutions:</h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-white">Issue: Tracks not downloading</p>
                <ul className="list-disc pl-6 text-zinc-400">
                  <li>Check that yt-dlp is installed and up to date</li>
                  <li>Verify your YouTube URLs are correct and accessible</li>
                  <li>Check server logs for specific errors</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-white">Issue: Cron job not running</p>
                <ul className="list-disc pl-6 text-zinc-400">
                  <li>Verify the cron job URL is correct</li>
                  <li>Check that your website is publicly accessible</li>
                  <li>Try running the endpoint manually to check for errors</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-white">Issue: yt-dlp errors</p>
                <ul className="list-disc pl-6 text-zinc-400">
                  <li>Update yt-dlp to the latest version: <code className="bg-zinc-800 px-1 rounded">pip3 install --upgrade yt-dlp</code></li>
                  <li>YouTube may have changed their API or site structure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 