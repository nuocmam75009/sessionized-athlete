import { describe, expect, it } from 'vitest'
import {
  buildProgressionGroups,
  buildTrainingSessions,
  defaultProgressionGroup,
  groupTrend,
  paceDeltas,
  qualityWorkLaps,
  repFormat,
  summarizeTrainings,
} from './training-analysis'
import type { Activity, Lap, LapIntensity, Workout } from './types'

const NOW = new Date(2026, 10, 10, 12, 0)
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

let lapCounter = 0
function lap(intensity: LapIntensity | null, durationSec: number, distanceM: number, avgHeartRate: number | null = null): Lap {
  lapCounter += 1
  return {
    id: `lap-${lapCounter}`,
    activityId: 'act',
    index: lapCounter,
    distanceM,
    durationSec,
    avgPaceSecPerKm: null,
    avgHeartRate,
    maxHeartRate: null,
    avgCadence: null,
    avgPower: null,
    avgStanceTimeMs: null,
    avgVerticalOscillationMm: null,
    avgVerticalRatio: null,
    avgStepLengthMm: null,
    intensity,
  }
}

// Échauffement, `reps` répétitions séparées de 90 s de trot, retour au calme.
function intervalLaps(reps: number, repSec: number, repM: number, repHr: number | null = null): Lap[] {
  const laps = [lap('WARMUP', 900, 3000, 135)]
  for (let i = 0; i < reps; i++) {
    laps.push(lap('INTERVAL', repSec, repM, repHr))
    if (i < reps - 1) laps.push(lap('RECOVERY', 90, 250, 145))
  }
  laps.push(lap('COOLDOWN', 600, 2000, 140))
  return laps
}

function activity(overrides: Partial<Activity> & Pick<Activity, 'id' | 'startedAt'>): Activity {
  return {
    athleteId: 'athlete-1',
    source: 'FIT',
    sport: 'running',
    subSport: null,
    totalDistanceM: 10000,
    totalDurationSec: 3000,
    avgHeartRate: null,
    maxHeartRate: null,
    avgCadence: null,
    avgPower: null,
    totalCalories: null,
    elevationGainM: null,
    elevationLossM: null,
    athleteNote: null,
    difficultyNote: null,
    workoutId: null,
    hasFitFile: true,
    hasGpxFile: false,
    labels: [],
    training: false,
    laps: [],
    ...overrides,
  }
}

const WORKOUT: Workout = {
  id: 'w-400',
  planId: 'plan-1',
  title: '10 × 400 m',
  scheduledDate: daysAgo(7),
  coachNote: null,
  targetDistanceM: null,
  targetDurationSec: null,
  targetHeartRateZone: null,
  training: true,
  laps: [],
  createdAt: daysAgo(30),
  updatedAt: daysAgo(30),
}

describe('qualityWorkLaps', () => {
  it('garde les répétitions d’un fractionné, dans l’ordre de la séance', () => {
    const laps = intervalLaps(3, 120, 500)
    const work = qualityWorkLaps([...laps].reverse())
    expect(work.map((l) => l.intensity)).toEqual(['INTERVAL', 'INTERVAL', 'INTERVAL'])
    expect(work.map((l) => l.index)).toEqual([...work.map((l) => l.index)].sort((a, b) => a - b))
  })

  it('accepte un seuil continu, sans récupération entre les laps', () => {
    const work = qualityWorkLaps([lap('WARMUP', 900, 3000), lap('ACTIVE', 1200, 4000), lap('COOLDOWN', 600, 2000)])
    expect(work).toHaveLength(1)
    expect(work[0].durationSec).toBe(1200)
  })

  it('ne voit pas de répétitions dans un découpage automatique au kilomètre', () => {
    expect(qualityWorkLaps([lap('ACTIVE', 300, 1000), lap('ACTIVE', 295, 1000), lap('ACTIVE', 290, 1000)])).toEqual([])
    expect(qualityWorkLaps([lap(null, 300, 1000), lap(null, 295, 1000)])).toEqual([])
  })
})

describe('repFormat', () => {
  it('classe les répétitions par durée moyenne : < 2 min, 2 à 6 min, ≥ 6 min', () => {
    expect(repFormat(119)).toBe('short')
    expect(repFormat(120)).toBe('medium')
    expect(repFormat(359)).toBe('medium')
    expect(repFormat(360)).toBe('long')
  })
})

describe('buildTrainingSessions', () => {
  const activities = [
    activity({ id: 'easy', startedAt: daysAgo(3) }),
    activity({ id: 'old', startedAt: daysAgo(120), training: true, laps: intervalLaps(10, 90, 400) }),
    activity({
      id: '400s',
      startedAt: daysAgo(7),
      training: true,
      workoutId: 'w-400',
      laps: intervalLaps(10, 90, 400, 172),
    }),
    activity({ id: 'velo', sport: 'Ride', startedAt: daysAgo(5), training: true, laps: intervalLaps(4, 300, 3000) }),
  ]

  it('ne garde que les séances de qualité de la période, de la plus ancienne à la plus récente', () => {
    expect(buildTrainingSessions(activities, [], '12w', NOW).map((s) => s.activity.id)).toEqual(['400s', 'velo'])
    expect(buildTrainingSessions(activities, [], 'all', NOW).map((s) => s.activity.id)).toEqual(['old', '400s', 'velo'])
  })

  it('mesure les répétitions et reprend le titre du workout lié', () => {
    const [session] = buildTrainingSessions(activities, [WORKOUT], '12w', NOW)
    expect(session.workoutTitle).toBe('10 × 400 m')
    expect(session.reps).toMatchObject({
      count: 10,
      avgDurationSec: 90,
      workDurationSec: 900,
      workDistanceM: 4000,
      // 900 s pour 4 km : 225 s/km, soit 3'45"/km.
      paceSecPerKm: 225,
      avgHeartRate: 172,
      format: 'short',
    })
  })

  it('ne calcule pas d’allure hors course à pied', () => {
    const velo = buildTrainingSessions(activities, [], '12w', NOW).find((s) => s.activity.id === 'velo')
    expect(velo?.reps).toMatchObject({ count: 4, format: 'medium', paceSecPerKm: null })
  })
})

describe('summarizeTrainings', () => {
  // Historique de quatre semaines : six activités, dont trois de qualité, plus
  // une séance de qualité ancienne, hors des 12 semaines.
  const activities = [
    activity({ id: 'e1', startedAt: daysAgo(28) }),
    activity({ id: 'q1', startedAt: daysAgo(21), training: true, laps: intervalLaps(6, 180, 900) }),
    activity({ id: 'e2', startedAt: daysAgo(20) }),
    activity({ id: 'q2', startedAt: daysAgo(14), training: true, laps: intervalLaps(6, 180, 920) }),
    activity({ id: 'e3', startedAt: daysAgo(10) }),
    // Laps tous en effort : comptée, mais sans répétitions mesurables.
    activity({ id: 'q3', startedAt: daysAgo(7), training: true, laps: [lap('ACTIVE', 1500, 5000), lap('ACTIVE', 1500, 5000)] }),
    activity({ id: 'q-old', startedAt: daysAgo(200), training: true, laps: intervalLaps(6, 180, 880) }),
  ]

  it('rapporte la fréquence à l’historique réel quand il est plus court que la période', () => {
    const sessions = buildTrainingSessions(activities, [], '12w', NOW)
    const summary = summarizeTrainings(sessions, activities, '12w', NOW)

    expect(summary).toMatchObject({
      sessionCount: 3,
      activityCount: 6,
      share: 0.5,
      // Deux séances × 6 × 3 min ; la troisième n'a pas de structure.
      workDurationSec: 2 * 6 * 180,
      unstructuredCount: 1,
    })
    // Trois séances en quatre semaines d'historique, et non en douze.
    expect(summary.perWeek).toBeCloseTo(0.75)
  })

  it('sur tout l’historique, compte depuis la première activité', () => {
    const sessions = buildTrainingSessions(activities, [], 'all', NOW)
    const summary = summarizeTrainings(sessions, activities, 'all', NOW)
    expect(summary.sessionCount).toBe(4)
    expect(summary.perWeek).toBeCloseTo(4 / (200 / 7))
  })

  it('sans activité, ni fréquence ni part', () => {
    expect(summarizeTrainings([], [], '12w', NOW)).toMatchObject({ sessionCount: 0, perWeek: null, share: null })
  })
})

describe('progression', () => {
  const activities = [
    // Trois séances de 1000 m (format moyen), de plus en plus rapides.
    activity({ id: 'k1', startedAt: daysAgo(30), training: true, laps: intervalLaps(5, 210, 1000, 168) }),
    activity({ id: 'k2', startedAt: daysAgo(20), training: true, laps: intervalLaps(5, 205, 1000, 170) }),
    activity({ id: 'k3', startedAt: daysAgo(10), training: true, laps: intervalLaps(5, 200, 1000, 169) }),
    // Un seuil (format long) et un trail court : d'autres groupes.
    activity({ id: 'seuil', startedAt: daysAgo(15), training: true, laps: intervalLaps(3, 600, 2400) }),
    activity({ id: 'cotes', sport: 'TrailRun', startedAt: daysAgo(5), training: true, laps: intervalLaps(8, 60, 200) }),
  ]
  const groups = buildProgressionGroups(buildTrainingSessions(activities, [], '12w', NOW))

  it('regroupe par sport puis par format, dans un ordre stable', () => {
    expect(groups.map((g) => g.key)).toEqual(['run:medium', 'run:long', 'trail_run:short'])
    expect(groups[0].sessions.map((s) => s.activity.id)).toEqual(['k1', 'k2', 'k3'])
  })

  it('montre par défaut le groupe le plus fourni', () => {
    expect(defaultProgressionGroup(groups)?.key).toBe('run:medium')
    expect(defaultProgressionGroup([])).toBeNull()
  })

  it('compare chaque séance à la précédente de son groupe seulement', () => {
    const deltas = paceDeltas(groups)
    expect(deltas.get('k2')).toBe(-5)
    expect(deltas.get('k3')).toBe(-5)
    // Premières de leur groupe : rien à comparer, pas même le seuil d'avant.
    expect(deltas.has('k1')).toBe(false)
    expect(deltas.has('seuil')).toBe(false)
    expect(deltas.has('cotes')).toBe(false)
  })

  it('confronte la dernière séance à la moyenne des précédentes', () => {
    expect(groupTrend(groups[0])).toMatchObject({
      latest: { activity: { id: 'k3' } },
      // (210 + 205) / 2 = 207,5, arrondi à 208.
      previousPaceSecPerKm: 208,
      previousHeartRate: 169,
    })
    expect(groupTrend(groups[1])).toMatchObject({ previousPaceSecPerKm: null, previousHeartRate: null })
  })
})
