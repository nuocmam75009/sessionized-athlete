'use client'

import { useEffect, useState } from 'react'
import { clientFetch } from '@/lib/client-fetch'
import type { ZoneDistribution } from '@/lib/types'

// Cache module : revenir sur une semaine déjà consultée ne redéclenche pas de
// requête. Le récapitulatif change de semaine à chaque clic dans le calendrier,
// et l'agrégation ne bouge pas tant qu'aucune activité n'est importée.
const cache = new Map<string, ZoneDistribution>()

class HttpError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

export type ZoneDistributionState =
  | { status: 'loading' }
  | { status: 'ready'; data: ZoneDistribution }
  // httpStatus null : requête qui n'a pas abouti (réseau, réponse illisible).
  // Le message est rédigé à l'affichage, dans la langue courante.
  | { status: 'error'; httpStatus: number | null }

// Ce hook ne se resynchronise pas quand `from`/`to` changent : monte un
// composant par période (key={week.startDateParam}) plutôt que de faire varier
// les bornes sur une instance vivante.
export function useZoneDistribution(from: string, to: string): ZoneDistributionState {
  const cacheKey = `${from}|${to}`
  const [state, setState] = useState<ZoneDistributionState>(() => {
    const cached = cache.get(cacheKey)
    return cached ? { status: 'ready', data: cached } : { status: 'loading' }
  })

  useEffect(() => {
    if (cache.has(cacheKey)) return

    const controller = new AbortController()
    const params = new URLSearchParams({ from, to })

    clientFetch(`/api/activities/hr-zones?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        // Seul le statut est gardé : le message affiché est rédigé par le
        // composant plutôt que repris de l'API, dont les textes sont en français.
        if (!res.ok) throw new HttpError(res.status)
        return (await res.json()) as ZoneDistribution
      })
      .then((data) => {
        cache.set(cacheKey, data)
        setState({ status: 'ready', data })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', httpStatus: err instanceof HttpError ? err.status : null })
      })

    return () => controller.abort()
  }, [cacheKey, from, to])

  return state
}
