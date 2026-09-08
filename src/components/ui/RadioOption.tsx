import type { ReactNode } from 'react'

interface RadioOptionProps {
  name: string
  checked: boolean
  onChange: () => void
  children: ReactNode
}

export function RadioOption({ name, checked, onChange, children }: RadioOptionProps) {
  return (
    <label className="group inline-flex items-center gap-2.5 cursor-pointer text-sm text-text/75 transition-colors hover:text-text">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
      {/* Coché : disque plein d'accent creusé en son centre par la couleur du
          fond, plus lisible sur noir qu'un point clair sur cercle vide. */}
      <span
        className={`w-4 h-4 shrink-0 rounded-full border transition-[background-color,border-color,box-shadow] duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2 ${
          checked
            ? 'border-accent bg-accent shadow-[inset_0_0_0_4px_var(--color-bg),0_0_14px_-2px_var(--color-accent)]'
            : 'border-neutral-400 group-hover:border-neutral-500'
        }`}
      />
      {children}
    </label>
  )
}
