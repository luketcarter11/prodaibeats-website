import Link from 'next/link'

const BEATS_LINKS = [
  { href: '/beats', label: 'All Beats' },
  { href: '/beats?sort=newest', label: 'New Releases' },
  { href: '/beats?sort=popular', label: 'Top Beats' },
  { href: '/beats?sort=az', label: 'Alphabetically A-Z' },
  { href: '/beats?sort=za', label: 'Alphabetically Z-A' },
  { href: '/beats?sort=hidden', label: 'Hidden Gems' },
]

const COMPANY_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/legal/terms-of-use', label: 'Terms of Use' },
  { href: '/legal/privacy-policy', label: 'Privacy Policy' },
]

export default function Footer() {
  return (
    <footer>
      <div className="bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Beats Links */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">BEATS</h3>
              <ul className="space-y-2">
                {BEATS_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">COMPANY</h3>
              <ul className="space-y-2">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">FOLLOW US</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://twitter.com/prodai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/prodai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com/prodai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    YouTube
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">NEWSLETTER</h3>
              <p className="text-gray-400">Subscribe to get updates on new beats and features.</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg flex-1"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dark Bar */}
      <div className="bg-black py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">© {new Date().getFullYear()} PRODAI BEATS. All rights reserved.</p>
            <ul className="flex gap-6">
              <li>
                <Link href="/legal/cookies" className="text-gray-400 hover:text-white transition-colors">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms-of-use" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
} 