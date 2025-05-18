import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Cookie Policy | PRODAI BEATS',
  description: 'PRODAI BEATS cookie policy - How we use cookies and similar technologies to improve your browsing experience.',
}

export default function CookiesPage() {
  return (
    <div className="bg-black min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gray-900 rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-white">Cookie Policy</h1>
          
          <div className="space-y-6 text-gray-300">
            <p>Last Updated: May 25, 2024</p>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">1. Introduction</h2>
              <p>
                This Cookie Policy explains how PRODAI BEATS ("we", "us", or "our") uses cookies and similar technologies 
                to recognize you when you visit our website at <Link href="/" className="text-purple-400 hover:underline">prodaibeats.com</Link> ("Website"). 
                It explains what these technologies are and why we use them, as well as your rights to control our use of them.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">2. What Are Cookies?</h2>
              <p>
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. 
                Cookies are widely used by website owners to make their websites work, or to work more efficiently, 
                as well as to provide reporting information.
              </p>
              <p>
                Cookies set by the website owner (in this case, PRODAI BEATS) are called "first-party cookies". 
                Cookies set by parties other than the website owner are called "third-party cookies". 
                Third-party cookies enable third-party features or functionality to be provided on or through the website 
                (e.g., advertising, interactive content, and analytics). The parties that set these third-party cookies 
                can recognize your computer both when it visits the website in question and also when it visits certain other websites.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">3. Why Do We Use Cookies?</h2>
              <p>We use first and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Website. Third parties serve cookies through our Website for advertising, analytics, and other purposes.</p>
              
              <div className="pl-4 space-y-4">
                <div>
                  <h3 className="font-bold text-white">Essential Cookies:</h3>
                  <p>These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas. These cookies don't collect personal information that could be used for marketing or tracking your browsing activity.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-white">Performance and Functionality Cookies:</h3>
                  <p>These cookies are used to enhance the performance and functionality of our Website but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-white">Analytics and Customization Cookies:</h3>
                  <p>These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-white">Advertising Cookies:</h3>
                  <p>These cookies are used to make advertising messages more relevant to you and your interests. They also perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed, and in some cases selecting advertisements that are based on your interests.</p>
                </div>
              </div>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">4. How Can You Control Cookies?</h2>
              <p>
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by clicking on the appropriate opt-out links provided in the cookie banner that appears when you first visit our Website.
              </p>
              <p>
                You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our Website though your access to some functionality and areas of our Website may be restricted. As the means by which you can refuse cookies through your web browser controls vary from browser-to-browser, you should visit your browser's help menu for more information.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">5. Cookies We Use</h2>
              <p>The specific types of first and third-party cookies served through our Website and the purposes they perform are described below:</p>
              
              <div className="pl-4 space-y-2">
                <p><span className="font-bold text-white">Authentication Cookies:</span> Used to identify you when you log in to our Website and provide secure access to your account.</p>
                <p><span className="font-bold text-white">Shopping Cart Cookies:</span> Remember items you have placed in your shopping cart and process purchases.</p>
                <p><span className="font-bold text-white">Session Cookies:</span> Temporary cookies that are deleted when you close your browser. They help us track your movements from page to page during a single visit.</p>
                <p><span className="font-bold text-white">Google Analytics:</span> We use Google Analytics to understand how visitors interact with our Website. These cookies collect information about your use of the Website, including which pages you go to most often and if you get error messages from certain pages.</p>
              </div>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">6. Updates to This Cookie Policy</h2>
              <p>
                We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
              </p>
              <p>
                The date at the top of this Cookie Policy indicates when it was last updated.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">7. Contact Us</h2>
              <p>
                If you have any questions about our use of cookies or other technologies, please email us at 
                <a href="mailto:contact@prodaibeats.com" className="text-purple-400 hover:underline ml-1">contact@prodaibeats.com</a> or contact us through our
                <Link href="/contact" className="text-purple-400 hover:underline ml-1">Contact page</Link>.
              </p>
            </section>
          </div>
          
          <div className="mt-10 pt-6 border-t border-gray-800">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <Link href="/legal/privacy-policy" className="text-purple-400 hover:underline">Privacy Policy</Link>
              <Link href="/legal/terms-of-service" className="text-purple-400 hover:underline">Terms of Service</Link>
              <Link href="/" className="text-purple-400 hover:underline">Return to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
