'use client'

import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { BackLink } from '@/components/ui/BackLink'
import { RouteMap } from '@/components/ui/RouteMap'
import { Stat } from '@/components/ui/Stat'
import { thClass, tdClass } from '@/components/ui/table'
import { getWorkout, tagVariant, labelFor } from '@/lib/mock-data'
import { useSessionState } from '@/lib/session-store'

export function ActivityDetailView({ id }: { id: string }) {
  const session = useSessionState()
  const workout = getWorkout(id)
  if (!workout) notFound()

  const wasUploaded = workout.status === 'today' && session.uploaded

  const actual =
    wasUploaded && session.lastUpload
      ? {
          distance: session.lastUpload.distance,
          duration: session.lastUpload.duration,
          pace: session.lastUpload.pace,
          note: 'Synced from COROS.',
        }
      : workout.actual

  const comparisonRows = actual
    ? [
        { metric: 'Distance', planned: workout.distance, actual: actual.distance },
        { metric: 'Duration', planned: workout.duration, actual: actual.duration },
        { metric: 'Avg pace / target', planned: workout.targetZone, actual: actual.pace },
      ]
    : []

  return (
    <div>
      <BackLink fallbackHref="/plan" />
      <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent mb-2">
        {workout.day} · {workout.date}
      </div>
      <div className="flex items-baseline gap-3">
        <h1 className="mb-0">{workout.title}</h1>
        <Badge variant={tagVariant(workout.status)}>{labelFor(workout.status)}</Badge>
      </div>
      <div className="flex gap-8 my-6">
        <Stat label="Distance" value={workout.distance} />
        <Stat label="Duration" value={workout.duration} />
        <Stat label="Target zone" value={workout.targetZone} />
      </div>

      {wasUploaded && session.lastUploadGpx && (
        <>
          <h4 className="mb-3">Route</h4>
          <RouteMap gpxData={session.lastUploadGpx} className="w-full h-[280px] rounded-md mb-6" />
        </>
      )}

      {workout.segments.length > 0 && (
        <>
          <h4 className="mb-3">Structure</h4>
          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr>
                <th className={thClass}>Segment</th>
                <th className={thClass}>Detail</th>
                <th className={thClass}>Target</th>
              </tr>
            </thead>
            <tbody>
              {workout.segments.map((seg) => (
                <tr key={seg.name}>
                  <td className={`${tdClass} font-semibold`}>{seg.name}</td>
                  <td className={tdClass}>{seg.detail}</td>
                  <td className={`${tdClass} text-text/60`}>{seg.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {workout.coachNote && (
        <blockquote className="mb-6 pl-4 border-l-2 border-accent-200 italic text-[17px] max-w-[56ch]">
          “{workout.coachNote}”
        </blockquote>
      )}

      {actual && (
        <>
          <h4 className="mb-3">Planned vs. completed</h4>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={thClass}>Metric</th>
                <th className={thClass}>Planned</th>
                <th className={thClass}>Actual</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((c) => (
                <tr key={c.metric}>
                  <td className={`${tdClass} text-text/60`}>{c.metric}</td>
                  <td className={tdClass}>{c.planned}</td>
                  <td className={`${tdClass} font-semibold`}>{c.actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="italic opacity-75 mt-3 max-w-[56ch]">{actual.note}</p>
        </>
      )}
    </div>
  )
}
