'use client';

import { useState } from 'react';
import { CopyIcon, CheckIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function DeploymentGuidePage() {
  const [activeTab, setActiveTab] = useState<'vercel' | 'godaddy' | 'cron'>('vercel');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Deployment Guide</h1>
      
      <div className="mb-8 border-b">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('vercel')}
            className={`px-4 py-2 border-b-2 ${activeTab === 'vercel' ? 'border-purple-600 text-purple-600' : 'border-transparent'}`}
          >
            Vercel Deployment
          </button>
          <button 
            onClick={() => setActiveTab('godaddy')}
            className={`px-4 py-2 border-b-2 ${activeTab === 'godaddy' ? 'border-purple-600 text-purple-600' : 'border-transparent'}`}
          >
            GoDaddy Domain
          </button>
          <button 
            onClick={() => setActiveTab('cron')}
            className={`px-4 py-2 border-b-2 ${activeTab === 'cron' ? 'border-purple-600 text-purple-600' : 'border-transparent'}`}
          >
            Cron Setup
          </button>
        </div>
      </div>

      {activeTab === 'vercel' && (
        <div>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Deploying to Vercel</h2>
            <ol className="list-decimal pl-5 space-y-6">
              <li>
                <h3 className="font-semibold">Create a Vercel Account</h3>
                <p className="mt-1">Go to <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">vercel.com</a> and sign up for an account. Connect your GitHub account when prompted.</p>
              </li>
              
              <li>
                <h3 className="font-semibold">Push Your Repository to GitHub</h3>
                <p className="mt-1">If you haven't already, create a new GitHub repository and push your codebase to it:</p>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md relative">
                  <pre className="text-sm overflow-x-auto">
                    git add .<br/>
                    git commit -m "Initial commit"<br/>
                    git push origin main
                  </pre>
                  <button 
                    onClick={() => handleCopy('git add .\ngit commit -m "Initial commit"\ngit push origin main')} 
                    className="absolute top-2 right-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                    aria-label="Copy code"
                  >
                    {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
                  </button>
                </div>
              </li>

              <li>
                <h3 className="font-semibold">Import Your Repository in Vercel</h3>
                <p className="mt-1">From your Vercel dashboard, click "Add New..." {'>'} "Project". Select your GitHub repository from the list. Vercel will automatically detect that it's a Next.js project.</p>
              </li>

              <li>
                <h3 className="font-semibold">Configure Your Project</h3>
                <p className="mt-1">Configure the build settings if necessary (Vercel should auto-detect Next.js). Add the following environment variables in the Vercel dashboard:</p>
                <ul className="list-disc pl-5 mt-2 space-y-2">
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_SITE_URL</code>: Your site URL (e.g., https://prodaibeats.com)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">CRON_SECRET_KEY</code>: A secure random string for protecting your cron endpoints</li>
                </ul>
              </li>

              <li>
                <h3 className="font-semibold">Deploy Your Project</h3>
                <p className="mt-1">Click "Deploy" and wait for the build to complete. Vercel will provide you with a deployment URL (e.g., prodaibeats.vercel.app).</p>
              </li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === 'godaddy' && (
        <div>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Connecting Your GoDaddy Domain</h2>
            <ol className="list-decimal pl-5 space-y-6">
              <li>
                <h3 className="font-semibold">Access Your GoDaddy Domain Settings</h3>
                <p className="mt-1">Log in to your GoDaddy account. Go to "My Products" {'>'} Domains and select your domain. Click "DNS" or "Manage DNS".</p>
              </li>
              
              <li>
                <h3 className="font-semibold">Add DNS Records for Vercel</h3>
                <p className="mt-1">Add the following DNS records:</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="py-2 px-4 text-left">Type</th>
                        <th className="py-2 px-4 text-left">Host</th>
                        <th className="py-2 px-4 text-left">Value</th>
                        <th className="py-2 px-4 text-left">TTL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="py-2 px-4">A</td>
                        <td className="py-2 px-4">@</td>
                        <td className="py-2 px-4">76.76.21.21</td>
                        <td className="py-2 px-4">600 seconds</td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-2 px-4">CNAME</td>
                        <td className="py-2 px-4">www</td>
                        <td className="py-2 px-4">cname.vercel-dns.com</td>
                        <td className="py-2 px-4">1 hour</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </li>

              <li>
                <h3 className="font-semibold">Configure Your Domain in Vercel</h3>
                <p className="mt-1">In your Vercel project, go to "Settings" {'>'} "Domains". Add your custom domain (e.g., prodaibeats.com). Vercel will verify your DNS configuration automatically.</p>
              </li>

              <li>
                <h3 className="font-semibold">Verify SSL Certificate</h3>
                <p className="mt-1">Vercel will automatically provision an SSL certificate for your domain. This process may take up to 24 hours to complete, but usually happens within minutes.</p>
              </li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === 'cron' && (
        <div>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Setting Up Cron Jobs for YouTube Music Integration</h2>
            <p className="mb-4">To automate YouTube Music track downloads, you need to set up a cron job to trigger the scheduler endpoint regularly.</p>
            
            <ol className="list-decimal pl-5 space-y-4">
              <li>
                <h3 className="font-semibold">Sign up for a cron job service</h3>
                <p className="mt-1">Create a free account at <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">cron-job.org</a></p>
              </li>
              
              <li>
                <h3 className="font-semibold">Create a new cron job</h3>
                <p className="mt-1">After logging in, click the "CREATE CRONJOB" button</p>
              </li>
              
              <li>
                <h3 className="font-semibold">Configure the cron job</h3>
                <p className="mt-1">Set up the following parameters:</p>
                <ul className="list-disc pl-5 mt-2 space-y-2">
                  <li><strong>Title:</strong> ProdAI Beats Scheduler</li>
                  <li>
                    <strong>URL:</strong> 
                    <div className="mt-1 flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <code className="flex-1 text-sm overflow-x-auto">https://yourdomain.com/api/cron/scheduler?key=YOUR_CRON_SECRET_KEY</code>
                      <button 
                        onClick={() => handleCopy('https://yourdomain.com/api/cron/scheduler?key=YOUR_CRON_SECRET_KEY')} 
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                        aria-label="Copy URL"
                      >
                        {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Replace "yourdomain.com" with your actual domain and "YOUR_CRON_SECRET_KEY" with the value you set in your environment variables.</p>
                  </li>
                  <li><strong>Execution schedule:</strong> Set to your preferred frequency (recommended: every hour)</li>
                </ul>
              </li>
              
              <li>
                <h3 className="font-semibold">Advanced settings</h3>
                <p className="mt-1">In the "Advanced Settings" section, set the following:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Request timeout: 30 seconds</li>
                  <li>Notification only on failure: Enabled</li>
                  <li>Save responses: Disabled</li>
                </ul>
              </li>
              
              <li>
                <h3 className="font-semibold">Activate your cron job</h3>
                <p className="mt-1">Click the "CREATE" button to save and activate your cron job</p>
              </li>
            </ol>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Link 
          href="/admin" 
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800"
        >
          Return to Admin Dashboard <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
} 