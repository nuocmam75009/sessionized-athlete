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

export function SegmentedControl({ name, options, value, onChange, ariaLabel, ariaLabelledBy }: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className="inline-flex overflow-hidden border border-divider rounded-md"
    >
      {options.map((opt, i) => {
        const checked = opt.value === value
        return (
          <label
            key={opt.value}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] cursor-pointer ${
              i > 0 ? 'border-l border-divider' : ''
            } ${checked ? 'bg-accent text-bg' : 'hover:bg-text/[0.07]'}`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        )
      })}
    </div>
  )
}
