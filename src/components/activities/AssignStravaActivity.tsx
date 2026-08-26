'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatActivity } from '@/lib/activity-format'
import { formatDateLabel } from '@/lib/utils'
import type { Activity } from '@/lib/types'

// Assignation manuelle : le sync Strava automatique (POST /strava/sync,
// déclenché à chaque chargement du dashboard) ne lie qu'une seule activité
// par workout du jour — si plusieurs activités Strava tombent le même jour,
// ou si le workout a été créé après coup par le coach, l'activité reste
// orpheline (workoutId null) et doit être assignée ici.
export function AssignStravaActivity({ workoutId, candidates }: { workoutId: string; candidates: Activity[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function assign(activityId: string) {
    setAssigningId(activityId)
    setError(null)
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId }),
      })
      if (!res.ok) throw new Error('assign failed')
      setOpen(false)
      router.refresh()
    } catch {
      setError("Échec de l'assignation. Réessaie.")
    } finally {
      setAssigningId(null)
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Assign Strava activity
      </Button>
    )
  }

  return (
    <div className="border border-divider rounded-md p-3 w-full max-w-[420px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">Assign a Strava activity</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-text/60 hover:text-text text-sm cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-2">
        {candidates.map((activity) => {
          const actual = formatActivity(activity)
          return (
            <div
              key={activity.id}
              className="flex items-center justify-between gap-2 border border-divider rounded-md px-2.5 py-2"
            >
              <div className="text-sm min-w-0">
                <div className="font-medium truncate">{activity.sport ?? 'Activity'}</div>
                <div className="text-text/60 text-[13px]">
                  {formatDateLabel(activity.startedAt)} · {actual.distance} · {actual.duration}
                </div>
              </div>
              <Button
                variant="ghost"
                className="shrink-0"
                onClick={() => assign(activity.id)}
                disabled={assigningId !== null}
              >
                {assigningId === activity.id ? 'Assigning…' : 'Assign'}
              </Button>
            </div>
          )
        })}
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
