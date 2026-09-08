// Avatar par initiales — pas de vraies photos de coach disponibles pour
// l'instant côté backend, mieux vaut ça qu'une image cassée ou inventée.

// Teintes sourdes + liseré intérieur : sur fond noir, une pastille en aplat
// franc happe l'œil plus que le nom qu'elle accompagne.
const PALETTE = [
  'bg-accent-200 text-accent-800 ring-accent-400/30',
  'bg-accent-2-200 text-accent-2-800 ring-accent-2-400/30',
  'bg-neutral-200 text-neutral-800 ring-neutral-400/30',
]

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function paletteFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % PALETTE.length
  return PALETTE[hash]
}

interface AvatarProps {
  name: string
  size?: number
}

export function Avatar({ name, size = 56 }: AvatarProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-heading font-semibold shrink-0 ring-1 ring-inset ${paletteFor(name)}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials(name)}
    </div>
  )
}
