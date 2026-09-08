'use client'

import { useEffect, useState } from 'react'
import { ActivityNoteEditor } from '@/components/activities/ActivityNoteEditor'
import { FitFileUpload } from '@/components/activities/FitFileUpload'
import { GpxRouteUpload } from '@/components/activities/GpxRouteUpload'
import { PlannedVsActualTable } from '@/components/activities/PlannedVsActualTable'
import { Badge } from '@/components/ui/Badge'
import { BackLink } from '@/components/ui/BackLink'
import { RouteMap, type RoutePoint } from '@/components/ui/RouteMap'
import { Stat } from '@/components/ui/Stat'
import { thClass, tdClass } from '@/components/ui/table'
import { activityLabelStyle, formatActivity, lapIntensityStyle } from '@/lib/activity-format'
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
  const planned = workout ? workoutTargets(workout) : null

  // L'API ne garantit pas l'ordre des laps, et le rattachement d'un .fit les
  // remplace en bloc : on trie sur index plutôt que de s'y fier.
  const laps = [...activity.laps].sort((a, b) => a.index - b.index)
  // Colonne affichée seulement si au moins un lap porte une intensité — sur une
  // activité Strava sans .fit rattaché, elle serait vide de bout en bout.
  const showIntensity = laps.some((lap) => lapIntensityStyle(lap.intensity) != null)
  const canAttachFit = activity.source === 'STRAVA' && !activity.hasFitFile

  return (
    <div>
      <BackLink fallbackHref="/dashboard" />
      <div className="font-heading font-semibold text-[10px] tracking-[0.18em] uppercase text-accent mb-2.5">
        {formatDateLabel(activity.startedAt)}
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="mb-0">{workout?.title ?? activity.sport ?? 'Activity'}</h1>
        <Badge variant="outline">{activity.source}</Badge>
        {activity.labels.map((label) => {
          const { text, variant } = activityLabelStyle(label)
          return (
            <Badge key={label} variant={variant}>
              {text}
            </Badge>
          )
        })}
      </div>
      <div className="panel rounded-lg my-7 px-6 py-5 flex gap-10 flex-wrap">
        <Stat label="Distance" value={actual.distance} />
        <Stat label="Duration" value={actual.duration} />
        <Stat label="Avg pace" value={actual.pace} />
      </div>

      {workout?.coachNote && (
        // Filet d'accent dégradé plutôt qu'un trait plein : sur fond noir, une
        // barre pleine de 2px sur toute la hauteur pèse plus que la citation.
        <blockquote className="mb-7 pl-5 border-l-2 border-transparent [border-image:linear-gradient(to_bottom,var(--color-accent),transparent)_1] text-[17px] leading-relaxed text-text/85 max-w-[56ch]">
          “{workout.coachNote}”
        </blockquote>
      )}

      {mapPoints && mapPoints.length > 0 && (
        <>
          <h4 className="mb-3">Route</h4>
          <RouteMap points={mapPoints} className="w-full h-[280px] rounded-lg mb-7 border border-divider" />
        </>
      )}
      {!hasGpsTrace && (
        <GpxRouteUpload
          activityId={activity.id}
          hasRoute={Boolean(gpxRoutePoints && gpxRoutePoints.length > 0)}
          onUploaded={setGpxRoutePoints}
        />
      )}

      {canAttachFit && <FitFileUpload activityId={activity.id} onAttached={setActivity} />}

      {laps.length > 0 && (
        <>
          <h4 className="mb-3">Laps</h4>
          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr>
                <th className={thClass}>Lap</th>
                {showIntensity && <th className={thClass}>Type</th>}
                <th className={thClass}>Distance</th>
                <th className={thClass}>Duration</th>
                <th className={thClass}>Pace</th>
                <th className={thClass}>Avg HR</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap) => {
                const intensity = lapIntensityStyle(lap.intensity)
                return (
                  <tr key={lap.id} className={intensity?.isRecovery ? 'bg-text/[0.045]' : ''}>
                    <td className={`${tdClass} metric font-semibold`}>{lap.index + 1}</td>
                    {showIntensity && (
                      <td className={tdClass}>
                        {intensity && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${intensity.dotClass}`} />
                            <span className="text-[9px] uppercase tracking-[0.1em] text-text/45">{intensity.label}</span>
                          </span>
                        )}
                      </td>
                    )}
                    <td className={`${tdClass} metric`}>{formatDistance(lap.distanceM)}</td>
                    <td className={`${tdClass} metric`}>{formatDuration(Math.round(lap.durationSec))}</td>
                    <td className={`${tdClass} metric text-text/55`}>
                      {/* Pas d'allure sur une récupération : trente mètres en
                          deux minutes donnent 1h/km, un chiffre qui n'apprend
                          rien et rend la colonne illisible. */}
                      {intensity?.isRecovery || lap.avgPaceSecPerKm == null ? '—' : formatPace(lap.avgPaceSecPerKm)}
                    </td>
                    <td className={`${tdClass} metric text-text/55`}>
                      {lap.avgHeartRate != null ? `${lap.avgHeartRate}bpm` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {planned && (
        <>
          <h4 className="mb-3">Planned vs. completed</h4>
          <PlannedVsActualTable planned={planned} actual={actual} />
        </>
      )}

      <ActivityNoteEditor activity={activity} onSaved={setActivity} />
    </div>
  )
}
