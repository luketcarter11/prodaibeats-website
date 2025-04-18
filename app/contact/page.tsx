'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General & Feedback',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // First check if the contact_messages table exists by attempting to query it
      const { error: tableCheckError } = await supabase
        .from('contact_messages')
        .select('id')
        .limit(1)
        .maybeSingle()
      
      if (tableCheckError) {
        console.warn('Contact messages table may not exist, attempting to create it')
        
        // Try to create the table if it doesn't exist
        // This would normally be done in migrations, but this is a fallback
        const { error: createTableError } = await supabase.rpc('create_contact_messages_table')
        
        if (createTableError) {
          console.error('Failed to create contact_messages table:', createTableError)
          throw new Error('Unable to save your message. Our team has been notified.')
        }
      }
      
      // Now insert the message
      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: 'new',
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error submitting message:', insertError)
        throw new Error('Failed to submit your message. Please try again.')
      }

      // Success! Reset the form and show success message
      setSuccess('Your message has been sent! We\'ll get back to you soon.')
      setFormData({
        name: '',
        email: '',
        subject: 'General & Feedback',
        message: ''
      })
    } catch (err) {
      console.error('Error in contact form submission:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-black">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-gray-900 to-black py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-gray-400">
            We're here to help. Whether you've got questions about beat licensing, need assistance accessing your files, or want to explore a partnership — just reach out.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-0">
        {/* FAQ Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold mb-4 text-white">Have a Question?</h2>
          <p className="text-sm text-gray-400 mb-4">
            Check out our <Link href="/faq" className="text-purple-500 hover:text-purple-400">FAQ page</Link> for quick answers on licensing, usage, delivery, and more.
          </p>
          <p className="text-sm text-gray-400">
            Still need help? Use the message box below and we'll get back to you shortly.
          </p>
        </motion.section>

        {/* Partnership Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold mb-4 text-white">Partnership Opportunities</h2>
          <p className="text-sm text-gray-400 mb-4">
            We're open to strategic partnerships — whether you're a platform, content agency, or brand looking to use our beats as copyright-free audio.
          </p>
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-base font-bold text-white mb-4">Examples include:</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Background music for content platforms</li>
              <li>• Royalty-free music libraries</li>
              <li>• Creative agency bundles or toolkits</li>
              <li>• Licensing for in-app audio or online games</li>
            </ul>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            If that sounds like a fit, send us a message below with a short overview of your proposal.
          </p>
        </motion.section>

        {/* Live Support Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-2 text-white">Live Support</h2>
            <p className="text-sm text-gray-400 mb-4">Need help right now?</p>
            <p className="text-sm text-gray-400">
              Use our live chat in the bottom corner — our AI assistant is ready to help 24/7.
            </p>
          </div>
        </motion.section>

        {/* Contact Form Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold mb-6 text-white">Send Us a Message</h2>
          
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-green-400">{success}</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-400 mb-2">
                Subject
              </label>
              <select
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                required
              >
                <option value="Account & Access">Account & Access</option>
                <option value="Licensing & Usage">Licensing & Usage</option>
                <option value="Business & Partnerships">Business & Partnerships</option>
                <option value="General & Feedback">General & Feedback</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : 'Send Message'}
              </button>
            </div>
          </form>
        </motion.section>
      </div>
    </main>
  )
}