import Link from 'next/link'

const BEATS_LINKS = [
  { href: '/beats', label: 'All Beats' },
  { href: '/beats?sort=newest', label: 'New Releases' },
  { href: '/beats?sort=popular', label: 'Top Beats' },
  { href: '/beats?sort=az', label: 'Alphabetically A-Z' },
  { href: '/beats?sort=za', label: 'Alphabetically Z-A' },
  { href: '/beats?sort=hidden', label: 'Hidden Gems' },
]

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