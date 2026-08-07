export function Stat({ label, value, size = 'lg' }: { label: string; value: string; size?: 'lg' | 'sm' }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] text-text/55">{label}</div>
      <div className={`font-heading font-semibold mt-1 ${size === 'lg' ? 'text-[22px]' : 'text-xl'}`}>{value}</div>
    </div>
  )
}
