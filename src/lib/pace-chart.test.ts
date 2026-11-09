import { describe, expect, it } from 'vitest'
import {
  formatClock,
  formatPaceTick,
  lapSpans,
  paceAxis,
  paceSeries,
  SLOWEST_PACE_SEC_PER_KM,
  sortLaps,
  summarizeLaps,
  timeTicks,
  workLapIds,
} from './pace-chart'
import type { Lap, LapIntensity, TrackPoint } from './types'

// T33 — graphe d'allure d'une séance et sélection de laps.

function lap(overrides: Partial<Lap> & Pick<Lap, 'id' | 'index'>): Lap {
  return {
    activityId: 'act-1',
    distanceM: 400,
    durationSec: 80,
    startElapsedSec: null,
    avgPaceSecPerKm: 200,
    avgHeartRate: null,
    maxHeartRate: null,
    avgCadence: null,
    avgPower: null,
    avgStanceTimeMs: null,
    avgVerticalOscillationMm: null,
    avgVerticalRatio: null,
    avgStepLengthMm: null,
    intensity: null,
    ...overrides,
  }
}

function point(elapsedSec: number, speedMPerSec: number | null, distanceM: number | null = null): TrackPoint {
  return {
    id: `tp-${elapsedSec}`,
    activityId: 'act-1',
    timestamp: new Date(Date.UTC(2026, 10, 7, 8, 0, elapsedSec)).toISOString(),
    elapsedSec,
    distanceM,
    latitude: null,
    longitude: null,
    altitudeM: null,
    heartRate: null,
    cadence: null,
    power: null,
    speedMPerSec,
  }
}

describe('lapSpans', () => {
  it('T33 — place chaque lap à son départ quand l’API le fournit, arrêts compris', () => {
    // Lap Strava : 60 s en mouvement, puis 30 s d'arrêt avant le lap suivant.
    const { spans, exact } = lapSpans([
      lap({ id: 'a', index: 0, durationSec: 60, startElapsedSec: 0 }),
      lap({ id: 'b', index: 1, durationSec: 60, startElapsedSec: 90 }),
    ])

    expect(exact).toBe(true)
    expect(spans).toEqual([
      // Le premier s'étend jusqu'au départ du second : l'arrêt n'est hors
      // d'aucun lap.
      { lapId: 'a', number: 1, start: 0, end: 90 },
      { lapId: 'b', number: 2, start: 90, end: 150 },
    ])
  })

  it('T33 — se rabat sur la somme des durées pour un lap importé avant le champ', () => {
    const { spans, exact } = lapSpans([
      lap({ id: 'a', index: 0, durationSec: 60 }),
      lap({ id: 'b', index: 1, durationSec: 45, startElapsedSec: 999 }),
    ])

    // Un seul départ manquant suffit : mélanger les deux repères décalerait
    // les laps les uns par rapport aux autres.
    expect(exact).toBe(false)
    expect(spans.map((s) => [s.start, s.end])).toEqual([
      [0, 60],
      [60, 105],
    ])
  })

  it('numérote les laps par position, quel que soit leur index (Strava part de 1)', () => {
    const { spans } = lapSpans(sortLaps([lap({ id: 'b', index: 2 }), lap({ id: 'a', index: 1 })]))
    expect(spans.map((s) => [s.lapId, s.number])).toEqual([
      ['a', 1],
      ['b', 2],
    ])
  })
})

describe('paceSeries', () => {
  it('T33 — convertit la vitesse en allure et plafonne l’arrêt à 10’00”/km', () => {
    const samples = paceSeries([point(0, 5), point(1, 5), point(2, 0), point(3, 0)], { smoothingSec: 0 })

    expect(samples).toEqual([
      { t: 0, pace: 200 },
      { t: 1, pace: 200 },
      { t: 2, pace: SLOWEST_PACE_SEC_PER_KM },
      { t: 3, pace: SLOWEST_PACE_SEC_PER_KM },
    ])
  })

  it('lisse sur une fenêtre de temps centrée', () => {
    const samples = paceSeries([point(0, 4), point(1, 4), point(2, 6), point(3, 6)], { smoothingSec: 2 })
    // En t = 1 : moyenne de 4, 4 et 6 → 4,67 m/s, soit 214,3 s/km.
    expect(samples[1]).toEqual({ t: 1, pace: 214.3 })
  })

  it('T33 — réduit une longue trace sans moyenner des allures', () => {
    // Une heure à 1 point/s, alternant 5 m/s et 2,5 m/s toutes les secondes.
    const points = Array.from({ length: 3600 }, (_, i) => point(i, i % 2 === 0 ? 5 : 2.5))
    const samples = paceSeries(points, { maxPoints: 100, smoothingSec: 0 })

    expect(samples.length).toBeLessThanOrEqual(100)
    // Vitesse moyenne 3,75 m/s → 266,7 s/km ; la moyenne des allures (200 et
    // 400 s/km) donnerait 300.
    expect(samples[10].pace).toBeCloseTo(266.7, 1)
  })

  it('interrompt la courbe sur une pause de la montre', () => {
    const samples = paceSeries([point(0, 4), point(1, 4), point(120, 4), point(121, 4)], { smoothingSec: 0 })
    expect(samples.map((s) => s.pace)).toEqual([250, 250, null, 250, 250])
  })

  it('déduit la vitesse de la distance quand la montre n’écrit pas la vitesse', () => {
    const samples = paceSeries([point(0, null, 0), point(10, null, 40), point(20, null, 80)], { smoothingSec: 0 })
    expect(samples.slice(1).map((s) => s.pace)).toEqual([250, 250])
  })

  it('rend une série vide sans vitesse ni distance', () => {
    expect(paceSeries([point(0, null), point(1, null)])).toEqual([])
    expect(paceSeries([point(0, 4)])).toEqual([])
  })
})

describe('summarizeLaps', () => {
  it('T33 — additionne distances et durées, pondère la FC par la durée', () => {
    const summary = summarizeLaps([
      lap({ id: 'a', index: 0, distanceM: 300, durationSec: 60, avgHeartRate: 160, maxHeartRate: 170 }),
      lap({ id: 'b', index: 2, distanceM: 300, durationSec: 180, avgHeartRate: 140, maxHeartRate: 175 }),
      lap({ id: 'c', index: 4, distanceM: 400, durationSec: 0, avgHeartRate: null, maxHeartRate: null }),
    ])

    expect(summary).toEqual({
      count: 3,
      distanceM: 1000,
      durationSec: 240,
      paceSecPerKm: 240,
      // (160 × 60 + 140 × 180) / 240
      avgHeartRate: 145,
      maxHeartRate: 175,
    })
  })

  it('ne donne ni allure ni FC sans distance ni mesure', () => {
    const summary = summarizeLaps([lap({ id: 'a', index: 0, distanceM: 0, durationSec: 120 })])
    expect(summary.paceSecPerKm).toBeNull()
    expect(summary.avgHeartRate).toBeNull()
    expect(summary.maxHeartRate).toBeNull()
  })
})

describe('workLapIds', () => {
  const withIntensity = (id: string, intensity: LapIntensity | null) => lap({ id, index: 0, intensity })

  it('T33 — renvoie les répétitions d’un fractionné', () => {
    expect(
      workLapIds([
        withIntensity('wu', 'WARMUP'),
        withIntensity('r1', 'INTERVAL'),
        withIntensity('rec', 'RECOVERY'),
        withIntensity('r2', 'ACTIVE'),
        withIntensity('cd', 'COOLDOWN'),
      ]),
    ).toEqual(['r1', 'r2'])
  })

  it('ne sélectionne rien sur une sortie régulière, même marquée ACTIVE', () => {
    expect(workLapIds([withIntensity('a', 'ACTIVE'), withIntensity('b', 'ACTIVE')])).toEqual([])
  })
})

describe('axes', () => {
  it('formate le temps écoulé et l’allure', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(330)).toBe('5:30')
    expect(formatClock(3905)).toBe('1:05:05')
    expect(formatPaceTick(286)).toBe(`4'46"`)
  })

  it('gradue le temps en minutes rondes', () => {
    expect(timeTicks(0, 900)).toEqual([0, 300, 600, 900])
    expect(timeTicks(130, 250)).toEqual([150, 180, 210, 240])
  })

  it('arrondit l’axe des allures à un pas rond, jamais de hauteur nulle', () => {
    expect(paceAxis([212, 250, null, 420])).toEqual({ domain: [180, 420], ticks: [180, 240, 300, 360, 420] })
    expect(paceAxis([240, 240]).domain).toEqual([240, 245])
  })
})
