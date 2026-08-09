import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

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

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClassName} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${inputClassName} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClassName} min-h-20 py-2 ${className}`} {...props} />
}
