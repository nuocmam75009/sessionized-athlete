import { formatDistance, formatDuration, formatPace } from './utils'
import type { Activity, Workout, WorkoutLap } from './types'

// Cibles agrégées des laps d'un workout, dans le même format que
// formatActivity() — pratique pour un tableau planned/actual côte à côte.
// Les laps n'ont pas forcément de cible chiffrée (targetDistanceM/
// targetPaceSecPerKm/targetDurationSec sont tous nullable côté backend).
export function workoutTargets(laps: WorkoutLap[]) {
  const totalDistanceM = laps.reduce((sum, lap) => sum + (lap.targetDistanceM ?? 0), 0)
  const totalDurationSec = laps.reduce((sum, lap) => sum + (lap.targetDurationSec ?? 0), 0)
  const paceValues = laps.map((lap) => lap.targetPaceSecPerKm).filter((v): v is number => v != null)
  const avgPaceSecPerKm =
    paceValues.length > 0 ? Math.round(paceValues.reduce((a, b) => a + b, 0) / paceValues.length) : 0

  return {
    distance: totalDistanceM > 0 ? formatDistance(totalDistanceM) : '—',
    duration: totalDurationSec > 0 ? formatDuration(totalDurationSec) : '—',
    pace: avgPaceSecPerKm > 0 ? formatPace(avgPaceSecPerKm) : '—',
  }
}

// Résume les cibles d'un workout en une ligne lisible.
export function summarizeWorkoutLaps(laps: WorkoutLap[]): string {
  const targets = workoutTargets(laps)
  const parts = [targets.distance, targets.duration, targets.pace].filter((p) => p !== '—')
  if (parts.length > 0) return parts.join(' · ')
  return `${laps.length} lap${laps.length > 1 ? 's' : ''}`
}

export function findLinkedActivityId(workoutId: string, activities: Activity[]): string | undefined {
  return activities.find((a) => a.workoutId === workoutId)?.id
}

export function findLinkedWorkout(activity: Activity, workouts: Workout[]): Workout | undefined {
  return activity.workoutId ? workouts.find((w) => w.id === activity.workoutId) : undefined
}
