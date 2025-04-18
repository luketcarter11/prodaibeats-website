'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface FAQCategory {
  icon: string
  title: string
  questions: {
    q: string
    a: string
  }[]
}

const faqData: FAQCategory[] = [
  {
    icon: '🎧',
    title: 'Licensing & Usage',
    questions: [
      {
        q: 'What does a license include?',
        a: 'Each license includes specific rights such as number of streams, royalty splits, and platforms you can use the beat on. View our licensing page for a full breakdown.'
      },
      {
        q: 'Can I use your beats commercially?',
        a: 'Yes. All of our licenses allow for commercial use, with specific terms depending on the license you choose.'
      },
      {
        q: 'Can I monetize my song with your beat on YouTube or Spotify?',
        a: 'Yes — monetization is permitted unless explicitly stated otherwise. Please refer to the stream limits on your license type.'
      },
      {
        q: 'Can I copyright a song I made using one of your beats?',
        a: 'You can copyright the final track (lyrics and vocals), but not the original beat. Even for exclusive licenses, we retain publishing rights.'
      },
      {
        q: 'Do you offer exclusive licenses?',
        a: 'Yes, we offer several levels of exclusivity including Exclusive, Exclusive Plus, and Exclusive Pro. Each one comes with different benefits.'
      }
    ]
  },
  {
    icon: '📥',
    title: 'Purchasing & Delivery',
    questions: [
      {
        q: 'How do I buy a beat?',
        a: 'Just click the cart icon next to the beat, choose your license type, and follow the checkout process. Your files will be delivered instantly.'
      },
      {
        q: 'What format will I receive the beat in?',
        a: 'All beats are delivered in high-quality MP3 format. No tags. Exclusive and higher-tier licenses may include additional formats upon request.'
      },
      {
        q: 'Where do I find my purchased beats?',
        a: 'You\'ll receive a download link via email and the beats will be available in your account dashboard after purchase.'
      },
      {
        q: 'Can I upgrade my license later?',
        a: 'No — licenses are final at the time of purchase. Please carefully review the license options and choose the one that best fits your needs.'
      }
    ]
  },
  {
    icon: '👥',
    title: 'Account & Access',
    questions: [
      {
        q: 'Do I need an account to buy a beat?',
        a: 'Yes — an account is required to purchase beats. This ensures you can access your purchases, download your files anytime, and receive important updates about your beats.'
      },
      {
        q: 'I lost access to my account. What should I do?',
        a: 'Use the "Forgot Password" option on the login page, or message us through the support box.'
      },
      {
        q: 'My download link expired or didn\'t arrive.',
        a: 'Log into your account and visit your dashboard. All your purchased beats are available for download there. If you need assistance, our support team is here to help.'
      }
    ]
  },
  {
    icon: '💼',
    title: 'Partnerships & Business Use',
    questions: [
      {
        q: 'Do you offer copyright-free beats for content creators or agencies?',
        a: 'Yes — we partner with brands, platforms, and creators to offer royalty-free music solutions. Reach out via the contact form with your proposal.'
      },
      {
        q: 'Can I use your beats for a game, film, or commercial project?',
        a: 'Yes — please include project details when messaging us and we\'ll confirm license compatibility.'
      },
      {
        q: 'Are there discounts for bulk licensing or platform usage?',
        a: 'We offer tailored pricing for agencies or platforms using multiple tracks. Contact us to discuss a partnership.'
      }
    ]
  },
  {
    icon: '📚',
    title: 'General Info',
    questions: [
      {
        q: 'Who makes the beats?',
        a: 'All tracks are curated and created by our in-house team, blending advanced tools with human creativity to deliver standout sound.'
      },
      {
        q: 'Are your beats tagged?',
        a: 'No — all beats are delivered tag-free once purchased.'
      },
      {
        q: 'Can I request custom beats?',
        a: 'Currently, we don\'t offer custom production. However, we frequently add new beats to the store.'
      },
      {
        q: 'Do you use samples in your beats?',
        a: 'All beats are original compositions and do not contain uncleared samples.'
      }
    ]
  }
]

export default function FAQPage() {
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [openQuestions, setOpenQuestions] = useState<string[]>([])

  const toggleCategory = (title: string) => {
    setOpenCategory(openCategory === title ? null : title)
  }

  const toggleQuestion = (q: string) => {
    setOpenQuestions(prev => 
      prev.includes(q) ? prev.filter(item => item !== q) : [...prev, q]
    )
  }

  return (
    <main className="bg-black">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-gray-900 to-black py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-400">
            Welcome to the Prod AI FAQ. If you can't find the answer you're looking for, feel free to send us a message using the support chat in the corner.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-6 py-0">
        <div className="space-y-6">
          {faqData.map((category) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 flex items-center justify-between hover:bg-zinc-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-xl font-bold text-white">{category.title}</h2>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 text-gray-400 transform transition-transform ${openCategory === category.title ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Questions */}
              {openCategory === category.title && (
                <div className="mt-4 space-y-4">
                  {category.questions.map((item) => (
                    <div key={item.q} className="border border-white/10 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleQuestion(item.q)}
                        className="w-full px-6 py-4 text-left bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
                      >
                        <h3 className="text-sm font-medium text-white">{item.q}</h3>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 text-gray-400 transform transition-transform ${openQuestions.includes(item.q) ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openQuestions.includes(item.q) && (
                        <div className="px-6 py-4 bg-zinc-900/20">
                          <p className="text-sm text-gray-400">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Still Have Questions?</h2>
        <p className="text-gray-400 mb-6">
          Can't find what you're looking for? We're here to help with any questions about our beats or services.
        </p>
        <a 
          href="/contact"
          className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg text-white font-medium"
        >
          Contact Us
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 ml-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </main>
  )
}