'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'
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
  const { locale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  async function assign(activityId: string) {
    setAssigningId(activityId)
    setFailed(false)
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
      setFailed(true)
    } finally {
      setAssigningId(null)
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t.assignStrava.open}
      </Button>
    )
  }

  return (
    <div className="panel rounded-lg p-4 w-full max-w-[420px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{t.assignStrava.title}</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-text/60 hover:text-text text-sm cursor-pointer"
        >
          {t.common.cancel}
        </button>
      </div>

      <div className="grid gap-2">
        {candidates.map((activity) => {
          const actual = formatActivity(activity, locale)
          return (
            <div
              key={activity.id}
              className="flex items-center justify-between gap-2 panel-flat rounded-md px-3 py-2.5"
            >
              <div className="text-sm min-w-0">
                <div className="font-medium truncate">{activity.sport ?? t.common.activity}</div>
                <div className="metric text-text/60 text-[12px] mt-0.5">
                  {formatDateLabel(activity.startedAt, locale)} · {actual.distance} · {actual.duration}
                </div>
              </div>
              <Button
                variant="ghost"
                className="shrink-0"
                onClick={() => assign(activity.id)}
                disabled={assigningId !== null}
              >
                {assigningId === activity.id ? t.assignStrava.assigning : t.assignStrava.assign}
              </Button>
            </div>
          )
        })}
      </div>
      {failed && (
        <p role="alert" className="text-sm text-danger mt-2">
          {t.assignStrava.failed}
        </p>
      )}
    </div>
  )
}
