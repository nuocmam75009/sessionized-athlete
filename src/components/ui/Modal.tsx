'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'

// Éléments atteignables au clavier, dans l'ordre du document.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Tab et Maj+Tab bouclent sur les éléments de la modale au lieu de partir vers
// la page masquée derrière, comme le prévoit le motif « dialogue modal » de
// l'ARIA APG. Un focus sorti de la modale (clic sur le fond) y est ramené.
function trapFocus(e: KeyboardEvent, panel: HTMLElement) {
  const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement

  if (!panel.contains(active)) {
    e.preventDefault()
    first.focus()
  } else if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

// Coquille commune aux modales du calendrier : portal sur <body>, fermeture au
// clic sur le backdrop ou via Escape, focus initial sur le bouton de fermeture,
// focus maintenu dans la modale puis rendu à l'élément qui l'a ouverte.
// Rendue uniquement après une interaction — jamais pendant le SSR, d'où l'accès
// direct à document.body.
//
// L'ouverture se fait en 3D : le panneau se redresse depuis une bascule arrière
// pendant que le fond passe en flou. C'est ce mouvement, pas une ombre, qui dit
// que la modale est devant le reste de la page.
export function Modal({
  label,
  eyebrow,
  onClose,
  children,
}: {
  label: string
  eyebrow: string
  onClose: () => void
  children: ReactNode
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // À l'ouverture seulement, et non à chaque nouvelle identité de onClose : un
  // parent qui la recrée à chaque rendu ramènerait sinon le focus sur le
  // bouton de fermeture en pleine saisie. À la fermeture, le focus revient à
  // l'élément d'origine (en général le jour cliqué du calendrier) : sans cela,
  // un utilisateur au clavier repartirait du début de la page.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()
    return () => {
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'Tab' && panelRef.current) trapFocus(e, panelRef.current)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const panelInitial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 26, rotateX: -11, scale: 0.97 }
  const panelAnimate = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 0, scale: 1 }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md [perspective:1200px]"
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        initial={panelInitial}
        animate={panelAnimate}
        transition={{ duration: 0.45, ease: [0.16, 0.84, 0.24, 1] }}
        className="panel w-full max-w-[560px] max-h-[85vh] overflow-y-auto rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="font-heading font-semibold text-[10px] tracking-[0.14em] uppercase text-accent">{eyebrow}</div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-text/60 transition-colors hover:bg-text/[0.07] hover:text-text cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  )
}
