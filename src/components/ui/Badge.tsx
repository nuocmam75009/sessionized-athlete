import type { ReactNode } from 'react'

type BadgeVariant = 'accent' | 'accent-2' | 'neutral' | 'outline'

// Fond sourd + liseré intérieur de la même famille : sur fond noir, un aplat
// sans contour se confond avec la carte qui le porte.
const variants: Record<BadgeVariant, string> = {
  accent: 'bg-accent-100 text-accent-800 ring-accent-400/35',
  'accent-2': 'bg-accent-2-100 text-accent-2-800 ring-accent-2-400/35',
  neutral: 'bg-neutral-100 text-neutral-800 ring-neutral-400/35',
  outline: 'text-accent ring-accent/45',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium uppercase tracking-[0.09em] px-2.5 py-1 rounded-sm ring-1 ring-inset ${variants[variant]}`}
    >
      {children}
    </span>
  )
}
