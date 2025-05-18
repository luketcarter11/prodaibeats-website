import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | PRODAI BEATS',
  description: 'PRODAI BEATS terms of service - The rules and guidelines for using our website and services.',
}

export default function TermsOfServicePage() {
  return (
    <div className="bg-black min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gray-900 rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-white">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-300">
            <p>Last Updated: May 25, 2024</p>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">1. Introduction</h2>
              <p>
                Welcome to PRODAI BEATS. These Terms of Service ("Terms") govern your use of our website located at <Link href="/" className="text-purple-400 hover:underline">prodaibeats.com</Link> ("Website") and any related services, features, content, or applications offered by PRODAI BEATS (collectively, the "Services").
              </p>
              <p>
                By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Services.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">2. Definitions</h2>
              <ul className="list-disc pl-8 space-y-2">
                <li><span className="font-bold text-white">"Content"</span> refers to all music, beats, audio files, graphics, videos, or other materials which you may encounter on our Website.</li>
                <li><span className="font-bold text-white">"User Content"</span> refers to all content, materials, and information submitted, posted, or otherwise provided by users.</li>
                <li><span className="font-bold text-white">"License"</span> refers to the rights granted to users who purchase beats or other content from our Website.</li>
                <li><span className="font-bold text-white">"Parties"</span> refers to both you and PRODAI BEATS collectively.</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">3. Account Creation and Responsibilities</h2>
              <p>
                To use certain features of our Website, you may need to create an account. When you create an account, you agree to provide accurate, current, and complete information and to update this information to maintain its accuracy.
              </p>
              <p>
                You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer or device. You accept responsibility for all activities that occur under your account.
              </p>
              <p>
                PRODAI BEATS reserves the right to refuse service, terminate accounts, or remove or edit content in its sole discretion.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">4. License Terms for Purchased Beats</h2>
              <p>
                When you purchase beats or other audio content from our Website, you are granted a license to use the content according to the specific license terms associated with your purchase. Each license type (Basic, Premium, Exclusive, etc.) comes with different rights and limitations.
              </p>
              <p>
                License terms will be provided at the time of purchase and may include limitations on:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>The number of distribution copies allowed</li>
                <li>Commercial use permissions</li>
                <li>Credit requirements</li>
                <li>Synchronization rights</li>
                <li>Performance restrictions</li>
                <li>Resale or transfer rights</li>
              </ul>
              <p>
                Full details of license terms are available on our <Link href="/licensing" className="text-purple-400 hover:underline">Licensing page</Link>.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">5. Intellectual Property Rights</h2>
              <p>
                The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of PRODAI BEATS and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
              </p>
              <p>
                Except as explicitly stated in the license terms for purchased beats, our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of PRODAI BEATS.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">6. Prohibited Activities</h2>
              <p>
                You agree not to engage in any of the following activities:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Using the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
                <li>Violating or infringing other people's intellectual property, privacy, publicity, or other legal rights</li>
                <li>Sharing or distributing purchased beats beyond the scope of the purchased license</li>
                <li>Attempting to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service</li>
                <li>Using the Service in any manner that could disable, overburden, damage, or impair the site</li>
                <li>Uploading or transmitting viruses, malware, or other types of malicious software</li>
                <li>Using any robot, spider, crawler, scraper, or other automated means to access the Service</li>
                <li>Attempting to bypass any measures designed to prevent or restrict access to the Service</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">7. Payments and Refunds</h2>
              <p>
                All purchases are final, and we do not provide refunds for digital products once they have been purchased and downloaded. However, if you experience technical issues with your purchase, please contact our customer support, and we will make reasonable efforts to resolve the issue.
              </p>
              <p>
                Prices for our products are subject to change without notice. We reserve the right to modify or discontinue the Service (or any part or content thereof) without notice at any time.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">8. Limitation of Liability</h2>
              <p>
                In no case shall PRODAI BEATS, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers, or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including, without limitation, lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages, whether based in contract, tort (including negligence), strict liability or otherwise, arising from your use of any of the service or any products procured using the service, or for any other claim related in any way to your use of the service or any product, including, but not limited to, any errors or omissions in any content, or any loss or damage of any kind incurred as a result of the use of the service or any content (or product) posted, transmitted, or otherwise made available via the service, even if advised of their possibility.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">9. Indemnification</h2>
              <p>
                You agree to indemnify, defend and hold harmless PRODAI BEATS and our subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, interns and employees, from any claim or demand, including reasonable attorneys' fees, made by any third-party due to or arising out of your breach of these Terms or the documents they incorporate by reference, or your violation of any law or the rights of a third-party.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">10. Termination</h2>
              <p>
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
              <p>
                If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion.
              </p>
              <p>
                All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">11. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
              </p>
              <p>
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">12. Changes to Terms of Service</h2>
              <p>
                We reserve the right, at our sole discretion, to update, change or replace any part of these Terms by posting updates and changes to our website. It is your responsibility to check our website periodically for changes.
              </p>
              <p>
                Your continued use of or access to our website or the Service following the posting of any changes to these Terms constitutes acceptance of those changes.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">13. Contact Information</h2>
              <p>
                Questions about the Terms of Service should be sent to us at <a href="mailto:contact@prodaibeats.com" className="text-purple-400 hover:underline">contact@prodaibeats.com</a> or through our <Link href="/contact" className="text-purple-400 hover:underline">Contact page</Link>.
              </p>
            </section>
          </div>
          
          <div className="mt-10 pt-6 border-t border-gray-800">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <Link href="/legal/cookies" className="text-purple-400 hover:underline">Cookie Policy</Link>
              <Link href="/legal/privacy-policy" className="text-purple-400 hover:underline">Privacy Policy</Link>
              <Link href="/" className="text-purple-400 hover:underline">Return to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
