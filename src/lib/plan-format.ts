import { formatDistance, formatDuration, formatPace } from './utils'
import type { Activity, Workout } from './types'

// Cibles d'un workout, dans le même format que formatActivity() — pratique
// pour un tableau planned/actual côte à côte. Un coach peut renseigner soit
// des cibles globales sur le workout (targetDistanceM/targetDurationSec),
// soit des cibles détaillées par lap (WorkoutLap.targetDistanceM/...), soit
// les deux — la somme des laps est prioritaire quand elle existe, sinon on
// retombe sur les cibles globales du workout.
export function workoutTargets(workout: Pick<Workout, 'laps' | 'targetDistanceM' | 'targetDurationSec'>) {
  const { laps } = workout
  const lapsDistanceM = laps.reduce((sum, lap) => sum + (lap.targetDistanceM ?? 0), 0)
  const lapsDurationSec = laps.reduce((sum, lap) => sum + (lap.targetDurationSec ?? 0), 0)
  const paceValues = laps.map((lap) => lap.targetPaceSecPerKm).filter((v): v is number => v != null)
  const lapsAvgPaceSecPerKm =
    paceValues.length > 0 ? Math.round(paceValues.reduce((a, b) => a + b, 0) / paceValues.length) : 0

  const totalDistanceM = lapsDistanceM > 0 ? lapsDistanceM : (workout.targetDistanceM ?? 0)
  const totalDurationSec = lapsDurationSec > 0 ? lapsDurationSec : (workout.targetDurationSec ?? 0)
  const avgPaceSecPerKm =
    lapsAvgPaceSecPerKm > 0
      ? lapsAvgPaceSecPerKm
      : totalDistanceM > 0 && totalDurationSec > 0
        ? Math.round(totalDurationSec / (totalDistanceM / 1000))
        : 0

  return {
    distance: totalDistanceM > 0 ? formatDistance(totalDistanceM) : '—',
    duration: totalDurationSec > 0 ? formatDuration(totalDurationSec) : '—',
    pace: avgPaceSecPerKm > 0 ? formatPace(avgPaceSecPerKm) : '—',
  }
}

// Résume les cibles d'un workout en une ligne lisible.
export function summarizeWorkoutLaps(workout: Pick<Workout, 'laps' | 'targetDistanceM' | 'targetDurationSec'>): string {
  const targets = workoutTargets(workout)
  const parts = [targets.distance, targets.duration, targets.pace].filter((p) => p !== '—')
  if (parts.length > 0) return parts.join(' · ')
  const { laps } = workout
  return `${laps.length} lap${laps.length > 1 ? 's' : ''}`
}

export function findLinkedActivityId(workoutId: string, activities: Activity[]): string | undefined {
  return activities.find((a) => a.workoutId === workoutId)?.id
}

export function findLinkedWorkout(activity: Activity, workouts: Workout[]): Workout | undefined {
  return activity.workoutId ? workouts.find((w) => w.id === activity.workoutId) : undefined
}
