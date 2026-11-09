'use client'

import { useEffect, useState } from 'react'
import { AerobicAnalysis } from '@/components/activities/AerobicAnalysis'
import { ActivityNoteEditor } from '@/components/activities/ActivityNoteEditor'
import { FitFileUpload } from '@/components/activities/FitFileUpload'
import { GpxRouteUpload } from '@/components/activities/GpxRouteUpload'
import { LapAnalysis } from '@/components/activities/LapAnalysis'
import { PlannedVsActualTable } from '@/components/activities/PlannedVsActualTable'
import { Badge } from '@/components/ui/Badge'
import { BackLink } from '@/components/ui/BackLink'
import { RouteMap, type RoutePoint } from '@/components/ui/RouteMap'
import { Stat } from '@/components/ui/Stat'
import { activityLabelStyle, formatActivity } from '@/lib/activity-format'
import { clientFetch } from '@/lib/client-fetch'
import { workoutTargets } from '@/lib/plan-format'
import { formatDateLabel } from '@/lib/utils'
import type { Activity, TrackPoint, Workout } from '@/lib/types'

export function ActivityDetailView({
  activity: initialActivity,
  workout,
}: {
  activity: Activity
  workout: Workout | null
}) {
  const [activity, setActivity] = useState(initialActivity)

  // Trace seconde par seconde : la carte n'en lit que les positions, le
  // graphe d'allure la vitesse et le temps écoulé.
  const [trackPoints, setTrackPoints] = useState<TrackPoint[] | null>(null)
  // Tracé importé séparément via le bouton .gpx (POST /activities/:id/gpx) —
  // pris en compte seulement si le .fit n'a pas déjà de trace GPS.
  const [gpxRoutePoints, setGpxRoutePoints] = useState<RoutePoint[] | null>(null)

  useEffect(() => {
    let cancelled = false
    clientFetch(`/api/activities/${activity.id}/track`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: TrackPoint[]) => {
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
    clientFetch(`/api/activities/${activity.id}/route`)
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

  const canAttachFit = activity.source === 'STRAVA' && !activity.hasFitFile
  // Le rattachement d'un .fit remplace les laps en bloc, sous de nouveaux
  // identifiants : la clé remonte LapAnalysis, dont la sélection désignerait
  // sinon des laps disparus.
  const lapsKey = activity.laps.map((lap) => lap.id).join()

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
          <h2 className="section-title mb-3">Route</h2>
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

      <AerobicAnalysis activityId={activity.id} />

      <LapAnalysis
        key={lapsKey}
        laps={activity.laps}
        trackPoints={trackPoints}
        lapTimesExcludePauses={canAttachFit}
      />

      {planned && (
        <>
          <h2 className="section-title mb-3">Planned vs. completed</h2>
          <PlannedVsActualTable planned={planned} actual={actual} />
        </>
      )}

      <ActivityNoteEditor activity={activity} onSaved={setActivity} />
    </div>
  )
}
