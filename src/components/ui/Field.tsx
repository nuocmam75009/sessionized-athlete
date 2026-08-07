import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export const inputClassName =
  'w-full min-h-9 px-2.5 py-1.5 text-sm text-text bg-surface border border-divider rounded-md placeholder:text-text/65 hover:border-text/45 focus-visible:border-accent focus-visible:outline-none'

interface FieldProps {
  label: string
  htmlFor: string
  children: ReactNode
}

export function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="block text-xs text-text/70">
        {label}
      </label>
      {children}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClassName} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputClassName} {...props} />
}
