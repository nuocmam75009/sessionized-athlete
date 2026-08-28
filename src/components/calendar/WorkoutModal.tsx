'use client'

import Link from 'next/link'
import { AssignStravaActivity } from '@/components/activities/AssignStravaActivity'
import { ImportActions } from '@/components/activities/ImportActions'
import { PlannedVsActualTable } from '@/components/activities/PlannedVsActualTable'
import { buttonClassName } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatActivity } from '@/lib/activity-format'
import { summarizeWorkoutLaps, workoutTargets } from '@/lib/plan-format'
import type { DayEntry } from '@/lib/calendar'

export function WorkoutModal({
  entry,
  onClose,
}: {
  entry: DayEntry
  onClose: () => void
}) {
  const { workout, linkedActivity, unplannedActivities, status } = entry
  const stravaCandidates = unplannedActivities.filter((a) => a.source === 'STRAVA')

  return (
    <Modal label={entry.dateLabel} eyebrow={entry.dateLabel} onClose={onClose}>
      {workout && (
        <>
          <h3 className="mb-2">{workout.title}</h3>
          {workout.coachNote && (
            <blockquote className="mb-4 pl-4 border-l-2 border-accent-200 italic text-[15px] max-w-[48ch]">
              “{workout.coachNote}”
            </blockquote>
          )}
          <p className="text-sm text-text/60 mb-5">{summarizeWorkoutLaps(workout)}</p>

          {status === 'done' && linkedActivity && (
            <>
              <PlannedVsActualTable planned={workoutTargets(workout)} actual={formatActivity(linkedActivity)} />
              <Link href={`/activities/${linkedActivity.id}`} className={`${buttonClassName('secondary')} mt-4`}>
                View full breakdown
              </Link>
            </>
          )}

          {(status === 'pending' || status === 'missed') && (
            <div className="flex gap-3 items-start flex-wrap">
              <ImportActions workoutId={workout.id} />
              {stravaCandidates.length > 0 && (
                <AssignStravaActivity workoutId={workout.id} candidates={stravaCandidates} />
              )}
            </div>
          )}
        </>
      )}

      {!workout && unplannedActivities.length > 0 && (
        <div className="grid gap-3">
          {unplannedActivities.map((activity) => {
            const actual = formatActivity(activity)
            return (
              <div key={activity.id} className="border border-divider rounded-md px-3 py-2.5">
                <div className="font-semibold text-sm mb-1">{activity.sport ?? 'Activity'}</div>
                <div className="text-text/60 text-sm mb-2">
                  {actual.distance} · {actual.duration} · {actual.pace}
                </div>
                <Link href={`/activities/${activity.id}`} className={buttonClassName('secondary')}>
                  View full breakdown
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {!workout && unplannedActivities.length === 0 && (
        <div>
          <p className="text-text/60 text-sm mb-4">Rien de prévu ce jour-là.</p>
          <Link href="/activities/upload" className={buttonClassName('secondary')}>
            Log a run
          </Link>
        </div>
      )}
    </Modal>
  )
}
