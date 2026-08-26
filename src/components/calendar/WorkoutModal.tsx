'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ImportActions } from '@/components/activities/ImportActions'
import { PlannedVsActualTable } from '@/components/activities/PlannedVsActualTable'
import { buttonClassName } from '@/components/ui/Button'
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
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const { workout, linkedActivity, unplannedActivities, status } = entry

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={entry.dateLabel}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] max-h-[85vh] overflow-y-auto bg-bg rounded-lg shadow-lg p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent">
            {entry.dateLabel}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-text/60 hover:text-text text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {workout && (
          <>
            <h3 className="mb-2">{workout.title}</h3>
            {workout.coachNote && (
              <blockquote className="mb-4 pl-4 border-l-2 border-accent-200 italic text-[15px] max-w-[48ch]">
                “{workout.coachNote}”
              </blockquote>
            )}
            <p className="text-sm text-text/60 mb-5">{summarizeWorkoutLaps(workout.laps)}</p>

            {status === 'done' && linkedActivity && (
              <>
                <PlannedVsActualTable planned={workoutTargets(workout.laps)} actual={formatActivity(linkedActivity)} />
                <Link
                  href={`/activities/${linkedActivity.id}`}
                  className={`${buttonClassName('secondary')} mt-4`}
                >
                  View full breakdown
                </Link>
              </>
            )}

            {(status === 'pending' || status === 'missed') && <ImportActions workoutId={workout.id} />}
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
            <p className="text-text/60 text-sm mb-4">Rien de prévu ni loggé ce jour-là.</p>
            <Link href="/activities/upload" className={buttonClassName('secondary')}>
              Log a run
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
