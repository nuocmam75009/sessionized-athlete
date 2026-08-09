// Avatar par initiales — pas de vraies photos de coach disponibles pour
// l'instant côté backend, mieux vaut ça qu'une image cassée ou inventée.

const PALETTE = [
  'bg-accent-200 text-accent-800',
  'bg-accent-2-200 text-accent-2-800',
  'bg-neutral-300 text-neutral-800',
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
      className={`inline-flex items-center justify-center rounded-full font-heading font-semibold shrink-0 ${paletteFor(name)}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  )
}
