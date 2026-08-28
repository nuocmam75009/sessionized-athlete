'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Coquille commune aux modales du calendrier : portal sur <body>, fermeture au
// clic sur le backdrop ou via Escape, focus initial sur le bouton de fermeture.
// Rendue uniquement après une interaction — jamais pendant le SSR, d'où l'accès
// direct à document.body.
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

  useEffect(() => {
    closeButtonRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] max-h-[85vh] overflow-y-auto bg-bg rounded-lg shadow-lg p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent">{eyebrow}</div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-text/60 hover:text-text text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
