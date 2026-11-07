'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { clientFetch } from '@/lib/client-fetch'

type SyncResult =
  // importedCount null : réponse sans compteur lisible, le sync a réussi quand même.
  | { kind: 'done'; importedCount: number | null }
  | { kind: 'rate-limited'; retryAfterMin: number | null }
  | { kind: 'error' }

// Corps de réponse de POST /strava/sync (succès) et de l'erreur 503
// STRAVA_RATE_LIMITED : on n'en lit que des nombres, jamais le message de l'API.
function readNumber(body: unknown, key: string): number | null {
  if (typeof body !== 'object' || body === null) return null
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function resultMessage(result: SyncResult): string {
  switch (result.kind) {
    case 'done':
      if (result.importedCount === null) return 'Synced with Strava.'
      if (result.importedCount === 0) return 'Already up to date.'
      return result.importedCount === 1 ? '1 new activity imported.' : `${result.importedCount} new activities imported.`
    case 'rate-limited':
      return result.retryAfterMin
        ? `Strava's request limit is reached. Try again in ${result.retryAfterMin} min.`
        : "Strava's request limit is reached. Try again later."
    case 'error':
      return "Couldn't sync with Strava. Try again."
  }
}

// Synchronisation Strava à la demande. Elle partait auparavant à chaque rendu
// du tableau de bord — chaque visite, chaque changement de mois — et
// interrogeait l'API Strava pour rien la plupart du temps, en consommant le
// quota partagé par tous les athlètes. L'athlète la déclenche désormais quand
// il sait avoir une nouvelle sortie.
export function StravaSyncButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SyncResult | null>(null)

  function sync() {
    setResult(null)
    startTransition(async () => {
      let next: SyncResult
      try {
        const res = await clientFetch('/api/strava/sync', { method: 'POST' })
        // 409 : connexion inutilisable (token illisible, accès retiré depuis
        // Strava). Seul l'athlète peut la réparer, depuis le bouton de
        // reconnexion du profil, qui propose aussi de déconnecter Strava.
        if (res.status === 409) {
          startTransition(() => router.push('/profile?strava=reconnect'))
          return
        }
        const body: unknown = await res.json().catch(() => null)
        if (res.status === 503) {
          // Quota de l'application chez Strava épuisé : réessayer tout de suite
          // ne servirait à rien, on dit dans combien de temps.
          const retryAfterSec = readNumber(body, 'retryAfterSec')
          next = { kind: 'rate-limited', retryAfterMin: retryAfterSec ? Math.ceil(retryAfterSec / 60) : null }
        } else if (res.ok) {
          next = { kind: 'done', importedCount: readNumber(body, 'importedCount') }
        } else {
          next = { kind: 'error' }
        }
      } catch {
        next = { kind: 'error' }
      }

      // Dans une transition : le message et le calendrier rechargé
      // apparaissent ensemble, et le bouton reste en attente jusque-là. Le
      // rechargement a lieu même sans nouvelle activité : le sync met aussi à
      // jour les zones cardiaques, et il ne coûte que des appels à notre API.
      startTransition(() => {
        setResult(next)
        if (next.kind === 'done') router.refresh()
      })
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap justify-end">
      {result &&
        (result.kind === 'done' ? (
          <p role="status" className="m-0 text-[13px] text-success">
            {resultMessage(result)}
          </p>
        ) : (
          <p role="alert" className="m-0 text-[13px] text-danger">
            {resultMessage(result)}
          </p>
        ))}
      <Button variant="secondary" onClick={sync} disabled={isPending}>
        {isPending && (
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full border-2 border-accent/30 border-t-accent animate-spin"
          />
        )}
        {isPending ? 'Syncing…' : 'Sync Strava'}
      </Button>
    </div>
  )
}
