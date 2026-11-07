'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatActivity } from '@/lib/activity-format'
import { clientFetch } from '@/lib/client-fetch'
import { formatDateLabel } from '@/lib/utils'
import type { Activity } from '@/lib/types'

// Assignation manuelle : le sync Strava (POST /strava/sync, déclenché par le
// bouton « Sync Strava » du calendrier) ne lie qu'une seule activité
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
      const res = await clientFetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId }),
      })
      if (!res.ok) throw new Error('assign failed')
      setOpen(false)
      router.refresh()
    } catch {
      setError("Couldn't assign the activity. Try again.")
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
    <div className="panel rounded-lg p-4 w-full max-w-[420px]">
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
              className="flex items-center justify-between gap-2 panel-flat rounded-md px-3 py-2.5"
            >
              <div className="text-sm min-w-0">
                <div className="font-medium truncate">{activity.sport ?? 'Activity'}</div>
                <div className="metric text-text/45 text-[12px] mt-0.5">
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
      {error && (
        <p role="alert" className="text-sm text-danger mt-2">
          {error}
        </p>
      )}
    </div>
  )
}
