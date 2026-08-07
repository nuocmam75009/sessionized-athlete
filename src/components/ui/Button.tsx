import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  block?: boolean
}

const base =
  'inline-flex items-center justify-center gap-1.5 cursor-pointer font-heading font-semibold text-sm leading-tight rounded-md transition-colors disabled:opacity-45 disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg px-4 py-2.5 hover:bg-accent-600 active:bg-accent-700',
  secondary: 'border border-divider px-4 py-2.5 hover:bg-text/[0.07] active:bg-text/[0.14]',
  ghost: 'text-accent px-2 py-2.5 hover:bg-accent/10 active:bg-accent/[0.18]',
}

export function buttonClassName(variant: ButtonVariant = 'primary', block = false, className = '') {
  return `${base} ${variants[variant]} ${block ? 'w-full mt-2' : ''} ${className}`
}

export function Button({ variant = 'primary', block, className = '', ...props }: ButtonProps) {
  return <button type="button" className={buttonClassName(variant, block, className)} {...props} />
}
