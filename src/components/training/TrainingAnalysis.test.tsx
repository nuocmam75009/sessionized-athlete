import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TrainingAnalysis } from './TrainingAnalysis'
import type { TrainingPacePoint } from '@/components/charts/TrainingPaceChart'
import type { Activity, Lap, Workout } from '@/lib/types'

// Recharts ne se dessine pas dans jsdom (pas de dimensions) : le graphe est
// remplacé par la liste des séances qu'il reçoit, ce qui est l'objet du test.
vi.mock('@/components/charts/TrainingPaceChart', () => ({
  TrainingPaceChart: ({ points }: { points: TrainingPacePoint[] }) => (
    <ul aria-label="pace chart">
      {points.map((p) => (
        <li key={p.id}>{p.id}</li>
      ))}
    </ul>
  ),
}))

const NOW = new Date(2026, 10, 10, 12, 0)
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

let lapId = 0
function lap(intensity: Lap['intensity'], durationSec: number, distanceM: number, avgHeartRate: number | null): Lap {
  lapId += 1
  return {
    id: `lap-${lapId}`,
    activityId: 'act',
    index: lapId,
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

// 5 × 1000 m (ou autre) avec récupérations, encadrés d'échauffement et de retour au calme.
function reps(count: number, repSec: number, repM: number, hr: number): Lap[] {
  const laps = [lap('WARMUP', 900, 3000, 135)]
  for (let i = 0; i < count; i++) {
    laps.push(lap('INTERVAL', repSec, repM, hr))
    laps.push(lap('RECOVERY', 90, 250, 145))
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

const WORKOUTS = [{ id: 'w-k3', title: '5 × 1000 m' } as Workout]

const ACTIVITIES: Activity[] = [
  activity({ id: 'easy-1', startedAt: daysAgo(25) }),
  activity({ id: 'easy-2', startedAt: daysAgo(12) }),
  activity({ id: 'k1', startedAt: daysAgo(28), training: true, laps: reps(5, 210, 1000, 168), difficultyNote: 7 }),
  activity({ id: 'k2', startedAt: daysAgo(14), training: true, laps: reps(5, 205, 1000, 170) }),
  activity({
    id: 'k3',
    startedAt: daysAgo(7),
    training: true,
    workoutId: 'w-k3',
    laps: reps(5, 200, 1000, 169),
    difficultyNote: 8,
  }),
  activity({ id: 'seuil', startedAt: daysAgo(3), training: true, laps: reps(3, 600, 2400, 165) }),
  // Il y a sept mois : seulement dans « All time ».
  activity({ id: 'k-old', startedAt: daysAgo(210), training: true, laps: reps(5, 220, 1000, 172) }),
]

function renderAnalysis(activities = ACTIVITIES) {
  render(<TrainingAnalysis activities={activities} workouts={WORKOUTS} now={NOW.toISOString()} />)
}

function kpi(label: string): string | null | undefined {
  return screen.getByText(label, { selector: 'div' }).nextElementSibling?.textContent
}

describe('Analyse des séances de qualité', () => {
  it('résume la période : nombre, fréquence, temps en répétitions, part des activités', () => {
    renderAnalysis()

    expect(kpi('Sessions')).toBe('4')
    // Quatre séances sur quatre semaines d'historique (première activité à J-28).
    expect(kpi('Per week')).toBe('1.0')
    // 3 × 5 × 3'25" en moyenne + 3 × 10 min = 51'15" + 30' = 1h21'.
    expect(kpi('Time in reps')).toBe("1h21'")
    expect(kpi('Share of activities')).toBe('67%')
    expect(screen.getByText('out of 6 activities')).toBeInTheDocument()
  })

  it('suit l’allure du format le plus fourni et la compare à la moyenne des précédentes', async () => {
    renderAnalysis()

    expect(screen.getByRole('heading', { name: 'Rep pace · Medium reps' })).toBeInTheDocument()
    expect(kpi('Last session')).toBe(`3'20"/km`)
    // (210 + 205) / 2 = 207,5 → 208 s/km, soit 3'28"/km.
    expect(screen.getByText(`8"/km faster than the average of earlier sessions (3'28"/km)`)).toBeInTheDocument()
    expect(screen.getByText('Same as the average of earlier sessions (169 bpm)')).toBeInTheDocument()

    const chart = await screen.findByRole('list', { name: 'pace chart' })
    expect(within(chart).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['k1', 'k2', 'k3'])
  })

  it('liste les séances de la plus récente à la plus ancienne, avec l’écart à la précédente du même format', () => {
    renderAnalysis()
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)

    expect(rows.map((r) => within(r).getAllByRole('cell')[1].textContent)).toEqual([
      'Run',
      '5 × 1000 m',
      'Run',
      'Run',
    ])
    expect(within(rows[0]).getAllByRole('cell')[2]).toHaveTextContent(`3 × 10'00"`)
    expect(within(rows[1]).getByRole('link')).toHaveAttribute('href', '/activities/k3')
    expect(rows[1]).toHaveTextContent('5 s/km faster than the previous one')
    expect(rows[1]).toHaveTextContent('8/10')
    // Le seuil est le premier de son format : pas d'écart.
    expect(within(rows[0]).getAllByRole('cell')[4]).toHaveTextContent('—')
  })

  it('change de format et de période depuis les sélecteurs', async () => {
    renderAnalysis()

    fireEvent.click(screen.getByRole('radio', { name: 'Long reps' }))
    expect(screen.getByRole('heading', { name: 'Rep pace · Long reps' })).toBeInTheDocument()
    expect(screen.getByText('First session in this format.')).toBeInTheDocument()
    expect(screen.getByText('The chart appears from the second session in this format.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Medium reps' }))
    fireEvent.click(screen.getByRole('radio', { name: 'All time' }))
    expect(kpi('Sessions')).toBe('5')
    const chart = await screen.findByRole('list', { name: 'pace chart' })
    expect(within(chart).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['k-old', 'k1', 'k2', 'k3'])
  })

  it('sans séance de qualité, explique comment en marquer une', () => {
    renderAnalysis(ACTIVITIES.map((a) => ({ ...a, training: false })))

    expect(screen.getByText(/switch on “Quality session” to see it here/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
