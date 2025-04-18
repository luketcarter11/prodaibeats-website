'use client'

import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <main className="bg-black">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-gray-900 to-black py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">About Prod AI</h1>
          <p className="text-gray-400">
          The Future of Music Production</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-0">
        {/* Vision Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-base text-gray-400 leading-relaxed mb-6">
            At Prod AI, we're reimagining music production with a modern twist — blending cutting-edge technology and real-world music sensibility to deliver beats that just hit different.
          </p>
          <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
            <p>
              Each instrumental in our catalog is the result of a unique creative process — part human, part machine — combining algorithmic precision with artistic instinct. The result? Timeless sounds built for artists, content creators, and visionaries who move fast and need fire production at their fingertips.
            </p>
            <p>
              We don't follow trends — we design them. Whether you're an underground rapper, a YouTuber, or just looking for a vibe, we've got beats for every mood, genre, and moment.
            </p>
            <p>
              We value simplicity, speed, and quality. Every license comes ready for release — no hidden fees, no complicated terms, just great music made for creators.
            </p>
          </div>
        </motion.section>

        {/* Why Prod AI Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold mb-6 text-white">Why Prod AI?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="h-1 w-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mb-4" />
              <p className="text-sm text-gray-400">Genre-blending beats created with both machine innovation and human taste</p>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="h-1 w-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mb-4" />
              <p className="text-sm text-gray-400">Clear, artist-friendly licensing with lifetime usage</p>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="h-1 w-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mb-4" />
              <p className="text-sm text-gray-400">Instant delivery, no gatekeeping</p>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="h-1 w-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mb-4" />
              <p className="text-sm text-gray-400">Exclusive and non-exclusive options to suit your goals</p>
            </div>
          </div>
        </motion.section>

        {/* Future Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center pb-4"
        >
          <p className="text-base font-bold text-white">
            This is the future of production — and you're early.
          </p>
        </motion.section>
      </div>
    </main>
  )
} 