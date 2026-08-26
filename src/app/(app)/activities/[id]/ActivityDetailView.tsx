'use client'

import { useEffect, useState } from 'react'
import { ActivityNoteEditor } from '@/components/activities/ActivityNoteEditor'
import { GpxRouteUpload } from '@/components/activities/GpxRouteUpload'
import { Badge } from '@/components/ui/Badge'
import { BackLink } from '@/components/ui/BackLink'
import { RouteMap, type RoutePoint } from '@/components/ui/RouteMap'
import { Stat } from '@/components/ui/Stat'
import { thClass, tdClass } from '@/components/ui/table'
import { formatActivity } from '@/lib/activity-format'
import { workoutTargets } from '@/lib/plan-format'
import { formatDateLabel, formatDistance, formatDuration, formatPace } from '@/lib/utils'
import type { Activity, Workout } from '@/lib/types'

export function ActivityDetailView({
  activity: initialActivity,
  workout,
}: {
  activity: Activity
  workout: Workout | null
}) {
  const [activity, setActivity] = useState(initialActivity)

  const [trackPoints, setTrackPoints] = useState<RoutePoint[] | null>(null)
  // Tracé importé séparément via le bouton .gpx (POST /activities/:id/gpx) —
  // pris en compte seulement si le .fit n'a pas déjà de trace GPS.
  const [gpxRoutePoints, setGpxRoutePoints] = useState<RoutePoint[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/activities/${activity.id}/track`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RoutePoint[]) => {
        if (!cancelled) setTrackPoints(data)
      })
      .catch(() => {
        if (!cancelled) setTrackPoints(null)
      })

    return () => {
      cancelled = true
    }
  }, [activity.id])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/activities/${activity.id}/route`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RoutePoint[]) => {
        if (!cancelled) setGpxRoutePoints(data)
      })
      .catch(() => {
        if (!cancelled) setGpxRoutePoints(null)
      })

    return () => {
      cancelled = true
    }
  }, [activity.id])

  const hasGpsTrace = Boolean(trackPoints && trackPoints.length > 0)
  const mapPoints = hasGpsTrace ? trackPoints : gpxRoutePoints

  const actual = formatActivity(activity)
  const planned = workout ? workoutTargets(workout.laps) : null

  return (
    <div>
      <BackLink fallbackHref="/plan" />
      <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent mb-2">
        {formatDateLabel(activity.startedAt)}
      </div>
      <div className="flex items-baseline gap-3">
        <h1 className="mb-0">{workout?.title ?? activity.sport ?? 'Activity'}</h1>
        <Badge variant="outline">{activity.source}</Badge>
      </div>
      <div className="flex gap-8 my-6">
        <Stat label="Distance" value={actual.distance} />
        <Stat label="Duration" value={actual.duration} />
        <Stat label="Avg pace" value={actual.pace} />
      </div>

      {workout?.coachNote && (
        <blockquote className="mb-6 pl-4 border-l-2 border-accent-200 italic text-[17px] max-w-[56ch]">
          “{workout.coachNote}”
        </blockquote>
      )}

      {mapPoints && mapPoints.length > 0 && (
        <>
          <h4 className="mb-3">Route</h4>
          <RouteMap points={mapPoints} className="w-full h-[280px] rounded-md mb-6" />
        </>
      )}
      {!hasGpsTrace && (
        <GpxRouteUpload
          activityId={activity.id}
          hasRoute={Boolean(gpxRoutePoints && gpxRoutePoints.length > 0)}
          onUploaded={setGpxRoutePoints}
        />
      )}

      {activity.laps.length > 0 && (
        <>
          <h4 className="mb-3">Laps</h4>
          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr>
                <th className={thClass}>Lap</th>
                <th className={thClass}>Distance</th>
                <th className={thClass}>Duration</th>
                <th className={thClass}>Pace</th>
                <th className={thClass}>Avg HR</th>
              </tr>
            </thead>
            <tbody>
              {activity.laps.map((lap) => (
                <tr key={lap.id}>
                  <td className={`${tdClass} font-semibold`}>{lap.index + 1}</td>
                  <td className={tdClass}>{formatDistance(lap.distanceM)}</td>
                  <td className={tdClass}>{formatDuration(Math.round(lap.durationSec))}</td>
                  <td className={`${tdClass} text-text/60`}>
                    {lap.avgPaceSecPerKm != null ? formatPace(lap.avgPaceSecPerKm) : '—'}
                  </td>
                  <td className={`${tdClass} text-text/60`}>
                    {lap.avgHeartRate != null ? `${lap.avgHeartRate}bpm` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {planned && (
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
              <tr>
                <td className={`${tdClass} text-text/60`}>Distance</td>
                <td className={tdClass}>{planned.distance}</td>
                <td className={`${tdClass} font-semibold`}>{actual.distance}</td>
              </tr>
              <tr>
                <td className={`${tdClass} text-text/60`}>Duration</td>
                <td className={tdClass}>{planned.duration}</td>
                <td className={`${tdClass} font-semibold`}>{actual.duration}</td>
              </tr>
              <tr>
                <td className={`${tdClass} text-text/60`}>Avg pace / target</td>
                <td className={tdClass}>{planned.pace}</td>
                <td className={`${tdClass} font-semibold`}>{actual.pace}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <ActivityNoteEditor activity={activity} onSaved={setActivity} />
    </div>
  )
}
