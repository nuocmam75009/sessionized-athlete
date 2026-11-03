import { describe, expect, it } from 'vitest'
import { summarizeWorkoutLaps, workoutTargets } from './plan-format'
import type { WorkoutLap } from './types'

function lap(overrides: Partial<WorkoutLap>): WorkoutLap {
  return {
    id: 'lap',
    workoutId: 'wk-1',
    index: 0,
    targetDistanceM: null,
    targetPaceSecPerKm: null,
    targetDurationSec: null,
    targetHeartRateZone: null,
    ...overrides,
  }
}

describe('workoutTargets', () => {
  it('donne la priorité à la somme des laps sur les cibles globales', () => {
    const targets = workoutTargets({
      targetDistanceM: 12000,
      targetDurationSec: 3600,
      laps: [lap({ targetDistanceM: 400, targetPaceSecPerKm: 200 }), lap({ targetDistanceM: 400, targetPaceSecPerKm: 210 })],
    })
    expect(targets.distance).toBe('0.8 km')
    // Durée absente des laps : on retombe sur la cible globale.
    expect(targets.duration).toBe(`1h00'`)
    expect(targets.pace).toBe(`3'25"/km`)
  })

  it('déduit l’allure des cibles globales quand les laps n’en donnent pas', () => {
    const targets = workoutTargets({ targetDistanceM: 10000, targetDurationSec: 3000, laps: [] })
    expect(targets).toEqual({ distance: '10.0 km', duration: `50'00"`, pace: `5'00"/km` })
  })

  it('affiche un tiret pour chaque cible absente', () => {
    expect(workoutTargets({ targetDistanceM: null, targetDurationSec: null, laps: [] })).toEqual({
      distance: '—',
      duration: '—',
      pace: '—',
    })
  })
})

describe('summarizeWorkoutLaps', () => {
  it('retombe sur le nombre de laps sans aucune cible', () => {
    expect(summarizeWorkoutLaps({ targetDistanceM: null, targetDurationSec: null, laps: [lap({}), lap({})] })).toBe('2 laps')
    expect(summarizeWorkoutLaps({ targetDistanceM: null, targetDurationSec: null, laps: [lap({})] })).toBe('1 lap')
  })
})
