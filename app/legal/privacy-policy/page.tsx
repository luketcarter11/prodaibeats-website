import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | PRODAI BEATS',
  description: 'PRODAI BEATS privacy policy - How we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-black min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gray-900 rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-white">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-300">
            <p>Last Updated: May 25, 2024</p>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">1. Introduction</h2>
              <p>
                PRODAI BEATS ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <Link href="/" className="text-purple-400 hover:underline">prodaibeats.com</Link> ("Website"), including any other media form, media channel, mobile website, or mobile application related or connected thereto.
              </p>
              <p>
                Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Website.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">2. Information We Collect</h2>
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Personal Data</h3>
                <p>
                  We may collect personally identifiable information, such as your:
                </p>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Billing address</li>
                  <li>Payment information</li>
                  <li>IP address</li>
                </ul>
                <p>
                  We collect this information when you register on our Website, place an order, subscribe to a newsletter, respond to a survey, fill out a form, use Live Chat, or enter information on our Website.
                </p>
              </div>
              
              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-bold text-white">Non-Personal Data</h3>
                <p>
                  We may also collect non-personal information about you whenever you interact with our Website. Non-personal information may include:
                </p>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Browser name</li>
                  <li>Type of computer or device</li>
                  <li>Technical information about your connection to our Website</li>
                  <li>Operating system</li>
                  <li>Internet service provider</li>
                  <li>Other similar information</li>
                </ul>
              </div>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">3. How We Use Your Information</h2>
              <p>
                We may use the information we collect from you in the following ways:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>To personalize your experience and deliver content and product offerings relevant to your interests</li>
                <li>To improve our Website in order to better serve you</li>
                <li>To allow us to better service you in responding to your customer service requests</li>
                <li>To process transactions and send you related information, including confirmations and invoices</li>
                <li>To administer promotions, surveys, or other Website features</li>
                <li>To send periodic emails regarding your order or other products and services</li>
                <li>To follow up after correspondence (live chat, email, or phone inquiries)</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">4. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to track the activity on our Website and store certain information. For more detailed information about the cookies we use, please see our <Link href="/legal/cookies" className="text-purple-400 hover:underline">Cookie Policy</Link>.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">5. Third-Party Disclosure</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except as described below:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>We may share your information with trusted third parties who assist us in operating our Website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.</li>
                <li>We may release your information when we believe release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property, or safety.</li>
                <li>We may share non-personally identifiable visitor information with other parties for marketing, advertising, or other uses.</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">6. Third-Party Services</h2>
              <p>
                We may use third-party service providers to help us operate our business and the Website or administer activities on our behalf, such as sending out newsletters or surveys. We may share your information with these third parties for those limited purposes provided that you have given us your permission.
              </p>
              <p>
                Third-party services used may include:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Payment processors (e.g., Stripe)</li>
                <li>Analytics providers (e.g., Google Analytics)</li>
                <li>Email service providers</li>
                <li>Customer support services</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">7. Data Security</h2>
              <p>
                We implement appropriate data collection, storage, processing practices, and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our Website.
              </p>
              <p>
                However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure and we cannot guarantee the absolute security of your personal information.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">8. Your Data Protection Rights</h2>
              <p>
                Depending on your location, you may have the following data protection rights:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>The right to access, update, or delete the information we have on you</li>
                <li>The right of rectification - to have your information corrected if it is inaccurate or incomplete</li>
                <li>The right to object to our processing of your personal data</li>
                <li>The right of restriction - to request that we restrict the processing of your personal information</li>
                <li>The right to data portability - to receive a copy of the information we have on you in a structured, machine-readable format</li>
                <li>The right to withdraw consent at any time where we relied on your consent to process your personal information</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at <a href="mailto:contact@prodaibeats.com" className="text-purple-400 hover:underline">contact@prodaibeats.com</a>.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">9. Children's Privacy</h2>
              <p>
                Our Website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are under 13, do not use or provide any information on this Website.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">10. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p>
                <a href="mailto:contact@prodaibeats.com" className="text-purple-400 hover:underline">contact@prodaibeats.com</a>
              </p>
              <p>
                Or through our <Link href="/contact" className="text-purple-400 hover:underline">Contact page</Link>.
              </p>
            </section>
          </div>
          
          <div className="mt-10 pt-6 border-t border-gray-800">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <Link href="/legal/cookies" className="text-purple-400 hover:underline">Cookie Policy</Link>
              <Link href="/legal/terms-of-service" className="text-purple-400 hover:underline">Terms of Service</Link>
              <Link href="/" className="text-purple-400 hover:underline">Return to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
