import type { ReactNode } from 'react'

interface RadioOptionProps {
  name: string
  checked: boolean
  onChange: () => void
  children: ReactNode
}

export function RadioOption({ name, checked, onChange, children }: RadioOptionProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
      <span
        className={`w-4 h-4 shrink-0 rounded-full border-[1.5px] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2 ${
          checked ? 'border-accent bg-accent shadow-[inset_0_0_0_4px_var(--color-bg)]' : 'border-divider'
        }`}
      />
      {children}
    </label>
  )
}
