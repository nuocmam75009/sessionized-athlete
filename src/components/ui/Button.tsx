import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  block?: boolean
}

// Le bouton se soulève au survol et s'enfonce au clic : la même grammaire que
// les cartes, pour que tout ce qui est cliquable réagisse en profondeur plutôt
// qu'en changeant de teinte.
const base =
  'inline-flex items-center justify-center gap-1.5 cursor-pointer font-heading font-medium text-sm leading-tight rounded-md ' +
  'transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out-3d ' +
  'hover:-translate-y-px active:translate-y-0 active:duration-75 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none'

const variants: Record<ButtonVariant, string> = {
  // L'ombre du primaire est teintée d'accent, pas noire : sur fond sombre,
  // c'est la lueur sous le bouton qui le fait décoller, pas une ombre portée.
  primary:
    'bg-accent text-bg px-4 py-2.5 shadow-[0_8px_20px_-10px_var(--color-accent)] ' +
    'hover:bg-accent-600 hover:shadow-[0_14px_32px_-12px_var(--color-accent)] active:bg-accent-700',
  // Le liseré haut passe par la variable de thème : en clair, un blanc à 5 %
  // sur un bouton déjà blanc ne dit rien, la variable l'y neutralise.
  secondary:
    'border border-divider bg-surface/60 px-4 py-2.5 shadow-[var(--panel-inset-flat)] ' +
    'hover:border-accent/45 hover:bg-surface-2 hover:text-accent-800 active:bg-surface',
  ghost: 'text-accent px-2.5 py-2.5 hover:bg-accent/12 hover:text-accent-700 active:bg-accent/20',
}

export function buttonClassName(variant: ButtonVariant = 'primary', block = false, className = '') {
  return `${base} ${variants[variant]} ${block ? 'w-full mt-2' : ''} ${className}`
}

export function Button({ variant = 'primary', block, className = '', ...props }: ButtonProps) {
  return <button type="button" className={buttonClassName(variant, block, className)} {...props} />
}
