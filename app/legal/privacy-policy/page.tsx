import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | ProdAI',
  description: 'Privacy Policy for ProdAI - AI-powered beat marketplace',
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">1. Introduction</h2>
          <p className="text-gray-300">
            ProdAI is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered beat marketplace platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">2. Information We Collect</h2>
          <p className="text-gray-300">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc pl-6 mt-2 text-gray-300">
            <li>Account information (name, email, password)</li>
            <li>Profile information (artist name, bio)</li>
            <li>Payment information (processed securely through our payment providers)</li>
            <li>Usage data and preferences</li>
            <li>Communication data (messages, feedback)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Information</h2>
          <p className="text-gray-300">
            We use the collected information to:
          </p>
          <ul className="list-disc pl-6 mt-2 text-gray-300">
            <li>Provide and maintain our services</li>
            <li>Process your transactions</li>
            <li>Improve our AI algorithms and beat recommendations</li>
            <li>Communicate with you about our services</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Storage and Security</h2>
          <p className="text-gray-300">
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">5. Sharing Your Information</h2>
          <p className="text-gray-300">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 mt-2 text-gray-300">
            <li>Service providers who assist in our operations</li>
            <li>Payment processors for transaction processing</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">6. Your Rights</h2>
          <p className="text-gray-300">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mt-2 text-gray-300">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to data processing</li>
            <li>Export your data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">7. Cookies and Tracking</h2>
          <p className="text-gray-300">
            We use cookies and similar tracking technologies to improve your experience on our platform. For more information, please see our Cookies Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">8. Changes to This Policy</h2>
          <p className="text-gray-300">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">9. Contact Us</h2>
          <p className="text-gray-300">
            If you have any questions about this Privacy Policy, please contact us at privacy@prodai.com
          </p>
        </section>
      </div>
    </div>
  )
} 