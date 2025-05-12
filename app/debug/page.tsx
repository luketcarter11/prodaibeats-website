import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Debug Dashboard',
  description: 'Tools for debugging Stripe and order processing',
};

export default function DebugDashboard() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stripe Webhook Debugging */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Stripe Webhook Debugging</h2>
          <div className="flex flex-col space-y-3">
            <Link 
              href="/api/test-webhook"
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-center"
            >
              Test Webhook
            </Link>
            <Link 
              href="/api/webhook-logs?format=html"
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-center"
            >
              View Webhook Logs
            </Link>
            <Link 
              href="/api/debug-webhook"
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-center"
            >
              Debug Webhook Connection
            </Link>
          </div>
        </div>
        
        {/* Order Testing */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Order Testing</h2>
          <div className="flex flex-col space-y-3">
            <Link 
              href="/api/test-order"
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-center"
            >
              Create Test Order
            </Link>
            <Link 
              href="/api/debug-table?table=orders&format=html"
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-center"
            >
              View Orders Table
            </Link>
            <Link 
              href="/api/test-webhook/users?format=html"
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-center"
            >
              View Users
            </Link>
          </div>
        </div>
        
        {/* Database Tools */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Database Tools</h2>
          <div className="flex flex-col space-y-3">
            <Link 
              href="/api/debug-table?table=tracks&format=html"
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-center"
            >
              View Tracks Table
            </Link>
            <Link 
              href="/api/debug-table?table=discount_codes&format=html"
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-center"
            >
              View Discount Codes
            </Link>
          </div>
        </div>
        
        {/* Documentation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Documentation</h2>
          <div className="flex flex-col space-y-3">
            <a 
              href="https://stripe.com/docs/webhooks/test"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-center"
            >
              Stripe Webhook Testing
            </a>
            <a 
              href="https://supabase.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-center"
            >
              Supabase Documentation
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Debugging Workflow</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Check <Link href="/api/webhook-logs?format=html" className="text-indigo-600 hover:underline">webhook logs</Link> to see if webhooks are being received</li>
          <li>Use the <Link href="/api/debug-webhook" className="text-indigo-600 hover:underline">Debug Webhook Connection</Link> tool to verify Supabase connection</li>
          <li>Try creating a <Link href="/api/test-order" className="text-indigo-600 hover:underline">test order</Link> directly to verify order creation works</li>
          <li>Use <Link href="/api/test-webhook" className="text-indigo-600 hover:underline">Test Webhook</Link> to simulate a Stripe checkout completion</li>
          <li>View the <Link href="/api/debug-table?table=orders&format=html" className="text-indigo-600 hover:underline">orders table</Link> to check if orders are being saved</li>
        </ol>
        
        <div className="mt-4 bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <h3 className="font-medium text-yellow-800">Important Notes</h3>
          <ul className="mt-2 text-sm text-yellow-700 space-y-1">
            <li>• The <code className="bg-yellow-100 px-1 rounded">user_id</code> field is required in orders. For test webhooks, use a valid UUID from the <Link href="/api/test-webhook/users?format=html" className="text-indigo-600 hover:underline">Users tool</Link>.</li>
            <li>• Order status must be one of: <code className="bg-yellow-100 px-1 rounded">pending</code>, <code className="bg-yellow-100 px-1 rounded">completed</code>, or <code className="bg-yellow-100 px-1 rounded">failed</code>.</li>
            <li>• All ID fields must be valid UUIDs in the format <code className="bg-yellow-100 px-1 rounded">xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 