'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button, buttonClassName } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const TABS = [
  { href: '/dashboard', label: 'Today' },
  { href: '/plan', label: 'Week' },
  { href: '/activities', label: 'History' },
  { href: '/messages', label: 'Messages' },
  { href: '/profile', label: 'Profile' },
]

export function TopBar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <nav className="flex items-center gap-8 px-8 py-4 border-b border-divider">
      <span className="font-heading font-semibold text-lg mr-4">Sessionized</span>
      <div className="flex gap-8 mr-auto">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`py-1.5 border-b-2 text-sm transition-colors ${
                active ? 'border-accent text-accent' : 'border-transparent hover:text-accent'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
      <Link href="/activities/upload" className={buttonClassName('secondary')}>
        Upload activity
      </Link>
      <Button variant="ghost" onClick={logout}>
        Log out
      </Button>
    </nav>
  )
}
