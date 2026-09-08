import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Champ creusé dans la carte plutôt que posé dessus : fond légèrement plus
// clair que la surface, liseré sombre en haut. Au focus, un halo d'accent
// remplace l'outline — plus lisible sur fond noir qu'un simple trait.
export const inputClassName =
  'w-full min-h-10 px-3 py-2 text-sm text-text bg-surface-2/70 border border-divider rounded-md ' +
  'placeholder:text-text/35 shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)] ' +
  'transition-[border-color,box-shadow,background-color] duration-200 ' +
  'hover:border-text/25 ' +
  'focus-visible:border-accent focus-visible:bg-surface-2 focus-visible:outline-none ' +
  'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]'

interface FieldProps {
  label: string
  htmlFor: string
  children: ReactNode
}

export function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="block text-[11px] uppercase tracking-[0.08em] text-text/50">
        {label}
      </label>
      {children}
    </div>
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClassName} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${inputClassName} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClassName} min-h-20 py-2.5 ${className}`} {...props} />
}
