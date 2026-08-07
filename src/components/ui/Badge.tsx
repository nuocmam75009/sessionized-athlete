import type { ReactNode } from 'react'

type BadgeVariant = 'accent' | 'accent-2' | 'neutral' | 'outline'

const variants: Record<BadgeVariant, string> = {
  accent: 'bg-accent-100 text-accent-800',
  'accent-2': 'bg-accent-2-100 text-accent-2-800',
  neutral: 'bg-neutral-100 text-neutral-800',
  outline: 'border border-accent text-accent',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center text-[11px] tracking-wide px-2.5 py-0.5 rounded-sm ${variants[variant]}`}>
      {children}
    </span>
  )
}
