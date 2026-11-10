import { describe, expect, it } from 'vitest'
import {
  buildMonthEntries,
  buildMonthSummary,
  buildWeekEntries,
  formatDayLabel,
  formatMonthLabel,
  formatWeekRangeLabel,
  formatWeekShortLabel,
  getDayStatus,
  getMonthGridDays,
  getWeekStart,
  parseMonthParam,
  toDateParam,
  toIsoDateTimeWithOffset,
  toMonthParam,
} from './calendar'
import type { Activity, Workout } from './types'

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: 'act-1',
    athleteId: 'athlete-1',
    source: 'FIT',
    sport: 'running',
    subSport: null,
    startedAt: new Date(2026, 7, 4, 8, 0).toISOString(),
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
    laps: [],
    ...overrides,
  }
}

function workout(overrides: Partial<Workout>): Workout {
  return {
    id: 'wk-1',
    planId: 'plan-1',
    title: 'Fractionné 10 × 400 m',
    scheduledDate: new Date(2026, 7, 4, 9, 0).toISOString(),
    coachNote: null,
    targetDistanceM: null,
    targetDurationSec: null,
    targetHeartRateZone: null,
    laps: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

// Table de décision complète de getDayStatus. Les combinaisons impossibles
// (aujourd'hui ET futur) ne sont pas listées.
describe('getDayStatus', () => {
  const base = { hasWorkout: false, hasLinkedActivity: false, hasUnplannedActivity: false, isToday: false, isFuture: false }

  it('T08 — séance prévue passée sans activité → missed', () => {
    expect(getDayStatus({ ...base, hasWorkout: true })).toBe('missed')
  })

  it.each([
    [{ hasWorkout: true, hasLinkedActivity: true }, 'done'],
    [{ hasWorkout: true, hasLinkedActivity: true, isFuture: true }, 'done'],
    [{ hasWorkout: true, isFuture: true }, 'upcoming'],
    [{ hasWorkout: true, isToday: true }, 'pending'],
    // Une activité non liée ne rattrape pas une séance manquée : elle doit
    // être assignée explicitement.
    [{ hasWorkout: true, hasUnplannedActivity: true }, 'missed'],
    [{ hasUnplannedActivity: true }, 'unplanned'],
    [{}, 'empty'],
    [{ isFuture: true }, 'empty'],
  ])('%o → %s', (flags, expected) => {
    expect(getDayStatus({ ...base, ...flags })).toBe(expected)
  })
})

describe('parseMonthParam', () => {
  const now = new Date(2026, 10, 3, 14, 30)
  const currentMonth = new Date(2026, 10, 1)

  it('lit un mois valide', () => {
    expect(parseMonthParam('2026-08', now)).toEqual(new Date(2026, 7, 1))
  })

  it('accepte les bornes janvier et décembre', () => {
    expect(parseMonthParam('2026-01', now)).toEqual(new Date(2026, 0, 1))
    expect(parseMonthParam('2026-12', now)).toEqual(new Date(2026, 11, 1))
  })

  it('retombe sur le mois courant sans paramètre', () => {
    expect(parseMonthParam(undefined, now)).toEqual(currentMonth)
  })

  // T07 — partitions invalides : hors format, et format valide mais mois hors
  // de 01–12 (new Date(2026, 12, 1) donnerait silencieusement janvier 2027).
  it.each(['abc', '2026-8', '2026-08-01', '2026-13', '2026-00', '2026-99'])('T07 — %j → mois courant', (raw) => {
    expect(parseMonthParam(raw, now)).toEqual(currentMonth)
  })

  it('fait l’aller-retour avec toMonthParam', () => {
    expect(toMonthParam(parseMonthParam('2025-02', now))).toBe('2025-02')
  })
})

describe('grille du mois', () => {
  it('commence la semaine le lundi, y compris depuis un dimanche', () => {
    // 9 août 2026 est un dimanche.
    expect(toDateParam(getWeekStart(new Date(2026, 7, 9)))).toBe('2026-08-03')
    expect(toDateParam(getWeekStart(new Date(2026, 7, 3)))).toBe('2026-08-03')
  })

  it.each([
    [new Date(2026, 1, 1), 35], // février 2026 : commence un dimanche
    [new Date(2026, 7, 1), 42], // août 2026 : commence un samedi, 31 jours
    [new Date(2027, 1, 1), 28], // février 2027 : du lundi 1er au dimanche 28
  ])('%s → %i cases, multiple de 7, du lundi au dimanche', (monthStart, expectedLength) => {
    const days = getMonthGridDays(monthStart)
    expect(days).toHaveLength(expectedLength)
    expect(days[0].getDay()).toBe(1)
    expect(days[days.length - 1].getDay()).toBe(0)
  })
})

describe('buildMonthEntries', () => {
  const monthStart = new Date(2026, 7, 1)
  const now = new Date(2026, 7, 10, 12, 0)

  function entryFor(entries: ReturnType<typeof buildMonthEntries>, dateParam: string) {
    const entry = entries.find((e) => e.dateParam === dateParam)
    if (!entry) throw new Error(`Pas de case pour ${dateParam}`)
    return entry
  }

  it('T08 — séance passée sans activité → missed, séance future → upcoming, séance du jour → pending', () => {
    const entries = buildMonthEntries(
      monthStart,
      [
        workout({ id: 'past', scheduledDate: new Date(2026, 7, 4, 9).toISOString() }),
        workout({ id: 'today', scheduledDate: new Date(2026, 7, 10, 18).toISOString() }),
        workout({ id: 'future', scheduledDate: new Date(2026, 7, 20, 9).toISOString() }),
      ],
      [],
      now,
    )
    expect(entryFor(entries, '2026-08-04').status).toBe('missed')
    expect(entryFor(entries, '2026-08-10').status).toBe('pending')
    expect(entryFor(entries, '2026-08-20').status).toBe('upcoming')
  })

  it('séance réalisée → done, avec l’activité liée', () => {
    const linked = activity({ id: 'act-linked', workoutId: 'wk-1' })
    const entries = buildMonthEntries(monthStart, [workout({})], [linked], now)
    const entry = entryFor(entries, '2026-08-04')
    expect(entry.status).toBe('done')
    expect(entry.linkedActivity?.id).toBe('act-linked')
  })

  it('activité sans séance → unplanned, comptée dans les totaux du jour', () => {
    const entries = buildMonthEntries(monthStart, [], [activity({ totalDistanceM: 8400 })], now)
    const entry = entryFor(entries, '2026-08-04')
    expect(entry.status).toBe('unplanned')
    expect(entry.distanceM).toBe(8400)
    expect(entry.activityCount).toBe(1)
  })
})

describe('récapitulatifs', () => {
  const monthStart = new Date(2026, 7, 1)
  const now = new Date(2026, 7, 31, 12)

  it('le mois ne compte pas les jours de padding des mois voisins', () => {
    const entries = buildMonthEntries(
      monthStart,
      [],
      [
        activity({ id: 'in-month', startedAt: new Date(2026, 7, 4, 8).toISOString(), totalDistanceM: 10000 }),
        // 28 juillet : affiché dans la première ligne de la grille d'août.
        activity({ id: 'padding', startedAt: new Date(2026, 6, 28, 8).toISOString(), totalDistanceM: 5000 }),
      ],
      now,
    )
    expect(buildMonthSummary(entries).distanceM).toBe(10000)
    // La semaine, elle, compte ses 7 jours affichés.
    expect(buildWeekEntries(entries)[0].summary.distanceM).toBe(5000)
  })

  it('FC moyenne de la semaine pondérée par la durée', () => {
    const entries = buildMonthEntries(
      monthStart,
      [],
      [
        activity({ id: 'long', startedAt: new Date(2026, 7, 4, 8).toISOString(), totalDurationSec: 3000, avgHeartRate: 140 }),
        activity({ id: 'short', startedAt: new Date(2026, 7, 5, 8).toISOString(), totalDurationSec: 1000, avgHeartRate: 180 }),
      ],
      now,
    )
    const week = buildWeekEntries(entries).find((w) => w.startDateParam === '2026-08-03')
    // (140 × 3000 + 180 × 1000) / 4000 = 150, et non la moyenne simple 160.
    expect(week?.summary.avgHeartRate).toBe(150)
  })

  it('regroupe "Run" (Strava) et "running" (.fit) dans le même sport', () => {
    const entries = buildMonthEntries(
      monthStart,
      [],
      [
        activity({ id: 'fit', sport: 'running', startedAt: new Date(2026, 7, 4, 8).toISOString() }),
        activity({ id: 'strava', source: 'STRAVA', sport: 'Run', startedAt: new Date(2026, 7, 5, 8).toISOString() }),
      ],
      now,
    )
    const bySport = buildMonthSummary(entries).bySport
    expect(bySport).toHaveLength(1)
    expect(bySport[0]).toMatchObject({ kind: 'run', activityCount: 2 })
  })
})

describe('formatage des dates', () => {
  it('ne répète le mois que lorsqu’il change', () => {
    expect(formatWeekShortLabel('2026-08-03', '2026-08-09', 'en')).toBe('Aug 3–9')
    expect(formatWeekShortLabel('2026-08-31', '2026-09-06', 'en')).toBe('Aug 31–Sep 6')
  })

  it('place le mois après les jours en français', () => {
    expect(formatWeekShortLabel('2026-08-03', '2026-08-09', 'fr')).toBe('3–9 août')
    expect(formatWeekShortLabel('2026-08-31', '2026-09-06', 'fr')).toBe('31 août–6 sept.')
    expect(formatWeekRangeLabel('2026-08-03', '2026-08-09', 'fr')).toBe('3 août – 9 août')
  })

  it('met une majuscule au mois et au jour en tête de libellé, en français', () => {
    expect(formatMonthLabel(new Date(2026, 7, 1), 'en')).toBe('August 2026')
    expect(formatMonthLabel(new Date(2026, 7, 1), 'fr')).toBe('Août 2026')
    expect(formatDayLabel('2026-08-04', 'en')).toBe('Tue, Aug 4')
    expect(formatDayLabel('2026-08-04', 'fr')).toBe('Mar. 4 août')
  })

  it('produit un datetime ISO complet avec l’offset local', () => {
    expect(toIsoDateTimeWithOffset('2026-08-24', 'start')).toMatch(/^2026-08-24T00:00:00[+-]\d{2}:\d{2}$/)
    expect(toIsoDateTimeWithOffset('2026-08-24', 'end')).toMatch(/^2026-08-24T23:59:59[+-]\d{2}:\d{2}$/)
  })
})
