'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'

interface Option<T extends string> {
  value: T
  label: string
  // Icône décorative placée devant le libellé ; elle suit la couleur du texte.
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  name: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  ariaLabelledBy?: string
}

// La pastille active glisse d'une option à l'autre au lieu d'apparaître : le
// mouvement porte l'information (« tu viens de passer de gauche à droite »).
// layoutId est dérivé de `name` — deux contrôles sur une même page partageraient
// sinon la même pastille et se la voleraient en s'animant l'un vers l'autre.
// Au-delà de deux options (filtre par sport du récapitulatif), les options
// passent à la ligne plutôt que de déborder d'un panneau étroit.
export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  ariaLabel,
  ariaLabelledBy,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className="inline-flex flex-wrap p-1 gap-1 rounded-md border border-divider bg-surface/60 shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)]"
    >
      {options.map((opt) => {
        const checked = opt.value === value
        return (
          <label
            key={opt.value}
            // La radio est masquée (sr-only) : son contour de focus serait
            // invisible, c'est l'option entière qui le porte au clavier.
            className={`relative inline-flex items-center justify-center px-3.5 py-1.5 text-[13px] rounded-sm cursor-pointer transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
              checked ? 'text-bg' : 'text-text/60 hover:text-text'
            }`}
          >
            {checked && (
              <motion.span
                layoutId={`segmented-${name}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-sm bg-accent shadow-[0_6px_16px_-8px_var(--color-accent)]"
              />
            )}
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              onChange={() => onChange(opt.value)}
            />
            <span className="relative z-10 inline-flex items-center gap-1.5 font-medium">
              {opt.icon}
              {opt.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}
