'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTheme } from '@/hooks/useTheme'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 1.6v2M10 16.4v2M18.4 10h-2M3.6 10h-2M15.9 4.1l-1.4 1.4M5.5 14.5l-1.4 1.4M15.9 15.9l-1.4-1.4M5.5 5.5L4.1 4.1" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9z" />
    </svg>
  )
}

// Un seul bouton plutôt qu'un interrupteur à deux positions : il doit tenir
// aussi bien dans la barre mobile que dans la sidebar repliée à 72px, où un
// segment sol/lune déborderait. L'icône montre la cible du clic (soleil quand
// on est en sombre), c'est la convention la plus répandue.
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const reduceMotion = useReducedMotion()
  const nextLabel = theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={nextLabel}
      title={nextLabel}
      className={`group relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md text-text/50 transition-colors hover:bg-text/[0.07] hover:text-accent cursor-pointer ${className}`}
    >
      {/* mode="wait" pour que l'icône sortante ait fini de pivoter avant que la
          suivante entre : les deux superposées à mi-course forment une bouillie. */}
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={theme}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -70, scale: 0.6 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 70, scale: 0.6 }}
          transition={{ duration: 0.22, ease: [0.16, 0.84, 0.24, 1] }}
          className="absolute inline-flex"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
