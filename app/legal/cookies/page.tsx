import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookies Policy | ProdAI',
  description: 'Cookies Policy for ProdAI - AI-powered beat marketplace',
}

export default function CookiesPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-white">Cookies Policy</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">1. What Are Cookies</h2>
          <p className="text-gray-300">
            Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and provide useful information to website owners.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">2. How We Use Cookies</h2>
          <p className="text-gray-300">
            We use cookies for the following purposes:
          </p>
          <ul className="list-disc pl-6 mt-2 text-gray-300">
            <li>Essential cookies: Required for the website to function properly</li>
            <li>Authentication cookies: To remember your login status</li>
            <li>Preference cookies: To remember your settings and preferences</li>
            <li>Analytics cookies: To understand how visitors use our website</li>
            <li>AI Performance cookies: To improve our beat recommendations and AI features</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">3. Types of Cookies We Use</h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-semibold text-white">Essential Cookies</h3>
              <p>These cookies are necessary for the website to function and cannot be switched off in our systems.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Performance Cookies</h3>
              <p>These cookies allow us to count visits and traffic sources to measure and improve the performance of our site.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Functional Cookies</h3>
              <p>These cookies enable the website to provide enhanced functionality and personalization.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Targeting Cookies</h3>
              <p>These cookies may be set through our site by our advertising partners to build a profile of your interests.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">4. Managing Cookies</h2>
          <p className="text-gray-300">
            Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, as it will no longer be personalized to you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">5. Third-Party Cookies</h2>
          <p className="text-gray-300">
            We may use third-party services that use cookies on our website, including:
          </p>
          <ul className="list-disc pl-6 mt-2 text-gray-300">
            <li>Google Analytics for website analytics</li>
            <li>Payment processors for secure transactions</li>
            <li>Social media platforms for content sharing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">6. Updates to This Policy</h2>
          <p className="text-gray-300">
            We may update this Cookies Policy from time to time. We will notify you of any changes by posting the new Cookies Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">7. Contact Us</h2>
          <p className="text-gray-300">
            If you have any questions about our Cookies Policy, please contact us at privacy@prodai.com
          </p>
        </section>
      </div>
    </div>
  )
} 