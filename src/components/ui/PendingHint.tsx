'use client'

import { useLinkStatus } from 'next/link'

// Point qui pulse dans un <Link> tant que la page demandée se prépare : nos
// pages sont dynamiques, la navigation attend leur rendu serveur (quatre
// appels à l'API pour le tableau de bord).
//
// Choisi à la place d'un loading.tsx, essayé puis retiré : il fait partir les
// pages en streaming, ce qui fige le statut HTTP à 200 (plus de vrai 404, T14)
// et change les redirections serveur en <meta refresh> doublé d'une navigation
// client. La page /profile se rechargeait une seconde après la redirection
// Strava, en perdant le clic de l'athlète (T21).
//
// Toujours rendu, seule l'opacité change : aucun décalage de mise en page.
export function PendingHint({ className = '' }: { className?: string }) {
  const { pending } = useLinkStatus()
  return (
    <span
      aria-hidden
      data-pending={pending || undefined}
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent transition-opacity duration-200 ${
        pending ? 'opacity-100 motion-safe:animate-pulse' : 'opacity-0'
      } ${className}`}
    />
  )
}
