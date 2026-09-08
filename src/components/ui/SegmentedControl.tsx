'use client'

import { motion } from 'motion/react'

interface Option {
  value: string
  label: string
}

interface SegmentedControlProps {
  name: string
  options: [Option, Option]
  value: string
  onChange: (value: string) => void
  ariaLabel?: string
  ariaLabelledBy?: string
}

// La pastille active glisse d'une option à l'autre au lieu d'apparaître : le
// mouvement porte l'information (« tu viens de passer de gauche à droite »).
// layoutId est dérivé de `name` — deux contrôles sur une même page partageraient
// sinon la même pastille et se la voleraient en s'animant l'un vers l'autre.
export function SegmentedControl({ name, options, value, onChange, ariaLabel, ariaLabelledBy }: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className="inline-flex p-1 gap-1 rounded-md border border-divider bg-surface/60 shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)]"
    >
      {options.map((opt) => {
        const checked = opt.value === value
        return (
          <label
            key={opt.value}
            className={`relative inline-flex items-center justify-center px-3.5 py-1.5 text-[13px] rounded-sm cursor-pointer transition-colors duration-200 ${
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
            <span className="relative z-10 font-medium">{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}
