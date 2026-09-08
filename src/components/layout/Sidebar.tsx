'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'

export type SidebarIconProps = { className?: string }
export type SidebarIcon = (props: SidebarIconProps) => React.JSX.Element

export interface SidebarNavItem {
  href: string
  label: string
  icon: SidebarIcon
}

export interface SidebarAction {
  key: string
  label: string
  icon: SidebarIcon
  href?: string
  onClick?: () => void
}

export interface SidebarProps {
  brand: string
  brandMark?: string
  navItems: SidebarNavItem[]
  actions?: SidebarAction[]
}

function MenuIcon({ className }: SidebarIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  )
}

function CloseIcon({ className }: SidebarIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  )
}

// Marque : un petit volume plutôt qu'un logotype. Le dégradé simule une face
// éclairée par le haut, et le bloc bascule légèrement au survol — c'est le
// seul objet franchement 3D de la navigation, tout le reste reste plat.
function BrandMark({ mark }: { mark: string }) {
  return (
    <span className="perspective-near">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-linear-to-br from-accent-600 to-accent-400 text-bg font-heading text-[13px] font-bold shadow-[0_6px_16px_-6px_var(--color-accent),inset_0_1px_0_rgb(255_255_255/0.35)] transition-transform duration-500 ease-out-3d hover:transform-[rotateX(24deg)_rotateY(-24deg)]">
        {mark}
      </span>
    </span>
  )
}

interface SidebarItemProps {
  label: string
  icon: SidebarIcon
  active: boolean
  collapsed: boolean
  showPill?: boolean
  href?: string
  onClick?: () => void
  onNavigate?: () => void
}

// Rend un item de nav (Link) ou d'action (button) avec le même habillage —
// la pastille active glissante (layoutId) n'apparaît que sur les vrais liens
// de nav, pas sur les actions du footer (upload, logout...).
function SidebarItem({ label, icon: Icon, active, collapsed, showPill = true, href, onClick, onNavigate }: SidebarItemProps) {
  const className =
    'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-200 cursor-pointer'

  const content = (
    <>
      {active && showPill && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-md bg-accent/10 ring-1 ring-inset ring-accent/25 shadow-[0_8px_24px_-14px_var(--color-accent)]"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          {/* Barre lumineuse sur l'arête gauche : le repère qu'on suit du coin
              de l'œil quand la sidebar est repliée en icônes seules. */}
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_1px_var(--color-accent)]" />
        </motion.div>
      )}
      <span
        className={`relative z-10 shrink-0 transition-[color,transform] duration-200 ease-out-3d group-hover:scale-110 ${
          active ? 'text-accent' : 'text-text/45 group-hover:text-text'
        }`}
      >
        <Icon />
      </span>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="label"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className={`relative z-10 whitespace-nowrap font-medium transition-colors ${active ? 'text-accent-800' : 'text-text/70 group-hover:text-text'}`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  )

  if (href) {
    return (
      <Link href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.()
        onNavigate?.()
      }}
      className={className}
    >
      {content}
    </button>
  )
}

function NavList({ items, collapsed, pathname, onNavigate }: { items: SidebarNavItem[]; collapsed: boolean; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return <SidebarItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={active} collapsed={collapsed} onNavigate={onNavigate} />
      })}
    </nav>
  )
}

function ActionList({ actions, collapsed, onNavigate }: { actions: SidebarAction[]; collapsed: boolean; onNavigate?: () => void }) {
  if (actions.length === 0) return null
  return (
    <div className="flex flex-col gap-1 border-t border-divider px-3 py-3">
      {actions.map((action) => (
        <SidebarItem
          key={action.key}
          href={action.href}
          onClick={action.onClick}
          label={action.label}
          icon={action.icon}
          active={false}
          collapsed={collapsed}
          showPill={false}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

// Aplat presque opaque, sans backdrop-filter. Un flou d'arrière-plan sur une
// barre haute comme le viewport est recalculé à chaque image du défilement :
// c'était le poste de dépense le plus visible au scroll, pour un effet que
// 92 % d'opacité rend de façon quasi identique sur un thème sombre — le halo
// d'ambiance transparaît encore.
const SHELL = 'bg-surface/92'

// Sidebar générique, sans dépendance à une app en particulier : la marque,
// les items de nav et les actions (upload, logout...) sont fournis par
// l'app appelante (voir AthleteSidebar.tsx). Repose uniquement sur les
// tokens de thème partagés (--color-accent, --color-surface, --color-text,
// --color-divider, --font-heading) — copiable tel quel dans sessionized-coach
// tant que ces tokens y sont définis.
export function Sidebar({ brand, brandMark, navItems, actions = [] }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mark = brandMark ?? brand.charAt(0).toUpperCase()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <div className={`sticky top-0 z-30 flex items-center gap-3 border-b border-divider px-4 py-3 md:hidden ${SHELL}`}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text/60 transition-colors hover:bg-text/[0.07] hover:text-text cursor-pointer"
        >
          <MenuIcon />
        </button>
        <BrandMark mark={mark} />
        <span className="font-heading font-semibold tracking-[-0.01em]">{brand}</span>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-divider md:hidden ${SHELL}`}
            >
              <div className="flex items-center justify-between px-4 py-4">
                <span className="flex items-center gap-2.5">
                  <BrandMark mark={mark} />
                  <span className="font-heading font-semibold tracking-[-0.01em]">{brand}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text/60 transition-colors hover:bg-text/[0.07] hover:text-text cursor-pointer"
                >
                  <CloseIcon />
                </button>
              </div>
              <NavList items={navItems} collapsed={false} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <ActionList actions={actions} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: collapsed ? 72 : 232 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`sticky top-0 z-30 hidden h-screen flex-col border-r border-divider md:flex ${SHELL}`}
      >
        {/* Filet lumineux le long de l'arête droite : il fait lire la sidebar
            comme un plan situé devant la page, pas comme une colonne peinte. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-accent/35 to-transparent"
        />

        <div className="flex items-center justify-between px-4 py-4">
          <AnimatePresence initial={false} mode="wait">
            {collapsed ? (
              <motion.span key="mark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BrandMark mark={mark} />
              </motion.span>
            ) : (
              <motion.span
                key="wordmark"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5"
              >
                <BrandMark mark={mark} />
                <span className="whitespace-nowrap font-heading font-semibold tracking-[-0.01em]">{brand}</span>
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-text/45 transition-colors hover:bg-text/[0.07] hover:text-text cursor-pointer"
          >
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <path d="M12 4l-5 6 5 6" />
            </motion.svg>
          </button>
        </div>

        <div className="mt-2 flex flex-1 flex-col">
          <NavList items={navItems} collapsed={collapsed} pathname={pathname} />
          <ActionList actions={actions} collapsed={collapsed} />
        </div>
      </motion.aside>
    </>
  )
}
