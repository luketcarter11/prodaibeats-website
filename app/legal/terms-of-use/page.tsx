import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use | ProdAI',
  description: 'Terms of Use for ProdAI - AI-powered beat marketplace',
}

export default function TermsOfUse() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-white">Terms of Use</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">1. Agreement to Terms</h2>
          <p className="text-gray-300">
            Welcome to ProdAI. By accessing or using our platform, you agree to be bound by these Terms of Use. Our platform provides an AI-powered marketplace for music producers and artists to create, buy, and sell beats and musical content.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">2. Intellectual Property Rights</h2>
          <p className="text-gray-300">
            When you purchase a beat on ProdAI, you receive specific licensing rights as detailed in the license agreement for each beat. The original producer retains the copyright to the musical composition, while you receive the rights specified in your purchase agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">3. User Accounts</h2>
          <p className="text-gray-300">
            To access certain features of ProdAI, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities under your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">4. AI-Generated Content</h2>
          <p className="text-gray-300">
            ProdAI uses artificial intelligence to assist in beat creation. Users acknowledge that AI-generated content may be subject to specific terms and conditions regarding ownership and usage rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">5. Payments and Refunds</h2>
          <p className="text-gray-300">
            All purchases are final unless otherwise specified. We process payments securely through our payment providers. Refunds may be issued on a case-by-case basis according to our refund policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">6. Prohibited Activities</h2>
          <p className="text-gray-300">
            Users are prohibited from engaging in any illegal activities, copyright infringement, or unauthorized use of the platform. ProdAI reserves the right to terminate accounts that violate these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">7. Limitation of Liability</h2>
          <p className="text-gray-300">
            ProdAI is not liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform or any content purchased through it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">8. Changes to Terms</h2>
          <p className="text-gray-300">
            We reserve the right to modify these terms at any time. Users will be notified of significant changes, and continued use of the platform constitutes acceptance of modified terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">9. Contact Information</h2>
          <p className="text-gray-300">
            For questions about these Terms of Use, please contact us at support@prodai.com
          </p>
        </section>
      </div>
    </div>
  )
} 