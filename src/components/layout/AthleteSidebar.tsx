'use client'

import { Sidebar, type SidebarAction, type SidebarIconProps, type SidebarNavItem } from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/useAuth'

function CalendarIcon({ className }: SidebarIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8h14M7 2v4M13 2v4" />
    </svg>
  )
}

function MessageIcon({ className }: SidebarIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v3l3.5-3H16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4z" />
    </svg>
  )
}

function ProfileIcon({ className }: SidebarIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3 3-5 6-5s6 2 6 5" />
    </svg>
  )
}

function HeartPulseIcon({ className }: SidebarIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 11h3l1.5-4L9 15l2-8 1.5 4H18" />
    </svg>
  )
}

function UploadIcon({ className }: SidebarIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 3v9M10 3l-3 3M10 3l3 3" />
      <path d="M3 13v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </svg>
  )
}

function LogoutIcon({ className }: SidebarIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
      <path d="M13 14l4-4-4-4" />
      <path d="M17 10H8" />
    </svg>
  )
}

const NAV_ITEMS: SidebarNavItem[] = [
  { href: '/dashboard', label: 'Calendar', icon: CalendarIcon },
  { href: '/messages', label: 'Messages', icon: MessageIcon },
  { href: '/athlete-data', label: 'Athlete Data', icon: HeartPulseIcon },
  { href: '/profile', label: 'Profile', icon: ProfileIcon },
]

export function AthleteSidebar() {
  const { logout } = useAuth()

  const actions: SidebarAction[] = [
    { key: 'upload', label: 'Upload activity', icon: UploadIcon, href: '/activities/upload' },
    { key: 'logout', label: 'Log out', icon: LogoutIcon, onClick: logout },
  ]

  return <Sidebar brand="Sessionized" navItems={NAV_ITEMS} actions={actions} />
}
