import type { CSSProperties, ReactNode } from 'react'
import type { SportKind } from '@/lib/sport'

// Icônes de sport en SVG inline, comme le reste des icônes de l'app (aucune
// librairie d'icônes n'est installée). Même grille 20x20 et même épaisseur de
// trait que les icônes de la sidebar.
const SPORT_PATHS: Record<SportKind, ReactNode> = {
  run: (
    <>
      <circle cx="12.6" cy="3.7" r="1.8" />
      <path d="M13.6 7 9.4 9.2l2 2.8-2.6 4.5" />
      <path d="M11.4 12l3.3 1.2 1 3.3" />
      <path d="M9.4 9.2 5.6 10.6" />
    </>
  ),
  trail_run: (
    <>
      <circle cx="12.6" cy="3.7" r="1.8" />
      <path d="M13.6 7 9.4 9.2l2 2.8-2.6 4.5" />
      <path d="M11.4 12l3.3 1.2 1 3.3" />
      <path d="M9.4 9.2 5.6 10.6" />
      <path d="M2 17.2l3-4 2 2.4 2.6-3.4" />
    </>
  ),
  ride: (
    <>
      <circle cx="4.6" cy="13.6" r="3.4" />
      <circle cx="15.4" cy="13.6" r="3.4" />
      <path d="M4.6 13.6 9 6.8h3.6l2.8 6.8" />
      <path d="M8 6.8h3.4" />
      <path d="M11 10.4H6.6" />
    </>
  ),
  swim: (
    <>
      <circle cx="6.4" cy="7.4" r="1.7" />
      <path d="M8.6 10.2 12.6 6.6l3.2 2.6" />
      <path d="M2 15c1.4 0 1.4 1.4 2.9 1.4S6.3 15 7.7 15s1.5 1.4 2.9 1.4S12.1 15 13.6 15s1.4 1.4 2.9 1.4S18 15 18 15" />
    </>
  ),
  walk: (
    <>
      <circle cx="11.4" cy="3.7" r="1.8" />
      <path d="M11.6 7 8.8 9.4l2 2.6-1.4 4.6" />
      <path d="M10.8 12l3 1.4.8 3.2" />
      <path d="M8.8 9.4 6.6 12" />
    </>
  ),
  hike: (
    <>
      <path d="M2 16.4h16" />
      <path d="M2 16.4 7.6 6.8l3.4 5.4" />
      <path d="m9.4 9.6 3.4-5 5.2 11.8" />
    </>
  ),
  strength: (
    <>
      <path d="M2.6 7.6v4.8M6 5.6v8.8M14 5.6v8.8M17.4 7.6v4.8" />
      <path d="M6 10h8" />
    </>
  ),
  row: (
    <>
      <circle cx="6.2" cy="5.2" r="1.7" />
      <path d="M8.2 8 12 5.4" />
      <path d="M17 3.6 8.6 12" />
      <path d="M2 15.4c1.5 0 1.5 1.4 3 1.4s1.5-1.4 3-1.4 1.5 1.4 3 1.4 1.5-1.4 3-1.4 1.5 1.4 3 1.4" />
    </>
  ),
  ski: (
    <>
      <circle cx="13.2" cy="4" r="1.7" />
      <path d="M14 7.2 10.4 9l2.2 2.6" />
      <path d="M17.6 3.8 15 16.6" />
      <path d="M2.4 12.6 15.6 17" />
      <path d="M2 15.2 14.8 10" />
    </>
  ),
  other: (
    <>
      <circle cx="10" cy="10" r="6.6" />
      <circle cx="10" cy="10" r="1.6" />
    </>
  ),
}

export function SportIcon({
  kind,
  size = 16,
  className = '',
  style,
}: {
  kind: SportKind
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {SPORT_PATHS[kind]}
    </svg>
  )
}
