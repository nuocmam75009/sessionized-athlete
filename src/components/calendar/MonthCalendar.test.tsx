import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MonthCalendar } from './MonthCalendar'
import {
  buildMonthEntries,
  buildMonthSummary,
  formatMonthLabel,
  getMonthGridDays,
  parseMonthParam,
  toDateParam,
} from '@/lib/calendar'
import { formatDistance, formatDuration } from '@/lib/utils'
import type { Activity, Workout } from '@/lib/types'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
// Les zones cardiaques de la semaine viennent d'une agrégation serveur, hors
// du périmètre de ce jeu d'essai : le panneau reste en chargement.
vi.mock('@/hooks/useZoneDistribution', () => ({ useZoneDistribution: () => ({ status: 'loading' }) }))

// Jeu d'essai du calendrier (dossier de projet, partie 10). Un mois fixe,
// octobre 2026, vu le mercredi 14 à midi : cinq séances prescrites par le
// coach et cinq sorties, importées d'un .fit ou de Strava. Les dates sont
// construites en heure locale, comme le calendrier les lit.
const MONTH = new Date(2026, 9, 1)
const NOW = new Date(2026, 9, 14, 12, 0)

function workout(id: string, title: string, day: number): Workout {
  return {
    id,
    planId: 'plan-1',
    title,
    scheduledDate: new Date(2026, 9, day, 9, 0).toISOString(),
    coachNote: null,
    targetDistanceM: null,
    targetDurationSec: null,
    targetHeartRateZone: null,
    laps: [],
    createdAt: '2026-09-25T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  }
}

function activity(overrides: Partial<Activity> & Pick<Activity, 'id' | 'startedAt'>): Activity {
  return {
    athleteId: 'athlete-1',
    source: 'STRAVA',
    sport: 'Run',
    subSport: null,
    totalDistanceM: 0,
    totalDurationSec: 0,
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
    hasFitFile: false,
    hasGpxFile: false,
    labels: [],
    laps: [],
    ...overrides,
  }
}

const WORKOUTS: Workout[] = [
  workout('w-footing', 'Footing 45 min', 6),
  workout('w-fractionne', 'Fractionné 10 × 400 m', 8),
  workout('w-longue', 'Sortie longue 1 h 30', 11),
  workout('w-seuil', 'Seuil 3 × 10 min', 14),
  workout('w-recup', 'Footing récupération', 16),
]

const ACTIVITIES: Activity[] = [
  // Mardi 29 septembre : jour du mois précédent, visible sur la première ligne.
  activity({ id: 'a-sept', source: 'FIT', sport: 'running', startedAt: new Date(2026, 8, 29, 8, 0).toISOString(), totalDistanceM: 8000, totalDurationSec: 2400 }),
  // Mardi 6 : réalise la séance prescrite.
  activity({ id: 'a-footing', source: 'FIT', sport: 'running', startedAt: new Date(2026, 9, 6, 8, 0).toISOString(), totalDistanceM: 9200, totalDurationSec: 2700, avgHeartRate: 142, maxHeartRate: 165, workoutId: 'w-footing' }),
  // Samedi 10 à 0 h 15, sortie de nuit : en heure UTC, encore le vendredi 9.
  activity({ id: 'a-soir', startedAt: new Date(2026, 9, 10, 0, 15).toISOString(), totalDistanceM: 5000, totalDurationSec: 1500, avgHeartRate: 150, maxHeartRate: 172 }),
  // Dimanche 11 : vélo le jour d'une sortie longue prescrite, non rattaché.
  activity({ id: 'a-velo', sport: 'Ride', startedAt: new Date(2026, 9, 11, 10, 0).toISOString(), totalDistanceM: 40000, totalDurationSec: 5400, avgHeartRate: 128, maxHeartRate: 151 }),
  // Lundi 12 : sortie sans séance prescrite.
  activity({ id: 'a-lundi', startedAt: new Date(2026, 9, 12, 7, 0).toISOString(), totalDistanceM: 6000, totalDurationSec: 1800 }),
]

function renderCalendar() {
  const entries = buildMonthEntries(MONTH, WORKOUTS, ACTIVITIES, NOW)
  render(<MonthCalendar entries={entries} />)
  const buttons = screen.getAllByRole('button')
  // Une ligne = 7 cases jour puis le bouton de la semaine (aria-pressed).
  const days = buttons.filter((b) => !b.hasAttribute('aria-pressed'))
  const weeks = buttons.filter((b) => b.hasAttribute('aria-pressed'))
  // Case d'un jour, retrouvée par sa date dans la grille.
  const day = (date: Date) => days[entries.findIndex((e) => e.dateParam === toDateParam(date))]
  return { entries, days, weeks, day }
}

// Valeur d'une métrique du récapitulatif, retrouvée par son étiquette.
function stat(container: HTMLElement, label: string): string | null {
  const labelEl = within(container)
    .getAllByText(label, { exact: true, selector: 'div' })
    .find((el) => el.nextElementSibling?.classList.contains('metric'))
  if (!labelEl) throw new Error(`Métrique introuvable : ${label}`)
  return labelEl.nextElementSibling?.textContent ?? null
}

const oct = (day: number) => new Date(2026, 9, day)

describe('Jeu d’essai — calendrier du mois', () => {
  it('cas 1 : octobre 2026 s’affiche en 5 semaines de 7 jours, du lundi 28 septembre au dimanche 1er novembre', () => {
    const { days, weeks } = renderCalendar()

    expect(formatMonthLabel(MONTH, 'en')).toBe('October 2026')
    expect(days).toHaveLength(35)
    expect(days[0]).toHaveTextContent(/^28/)
    expect(days[34]).toHaveTextContent(/^1/)
    expect(weeks.map((w) => w.textContent)).toEqual([
      'Week summary Sep 28 – Oct 4: 8.0 kmSep 28–Oct 4',
      'Week summary Oct 5 – Oct 11: 54.2 kmOct 5–11',
      'Week summary Oct 12 – Oct 18: 6.0 kmOct 12–18',
      'Week summary Oct 19 – Oct 25: 0.0 kmOct 19–25',
      'Week summary Oct 26 – Nov 1: 0.0 kmOct 26–Nov 1',
    ])
  })

  it('cas 2 : les jours des mois voisins sont atténués, ceux du mois non', () => {
    const { day } = renderCalendar()

    for (const date of [new Date(2026, 8, 28), new Date(2026, 8, 30), new Date(2026, 10, 1)]) {
      expect(day(date)).toHaveClass('opacity-35')
    }
    expect(day(oct(1))).not.toHaveClass('opacity-35')
    expect(day(oct(31))).not.toHaveClass('opacity-35')
  })

  it('cas 3 : chaque jour porte son statut (fait, manqué, aujourd’hui, à venir, non planifié, vide)', () => {
    const { day } = renderCalendar()

    expect(day(oct(6))).toHaveTextContent('6DoneFooting 45 min')
    expect(day(oct(8))).toHaveTextContent('8MissedFractionné 10 × 400 m')
    expect(day(oct(14))).toHaveTextContent('14TodaySeuil 3 × 10 min')
    expect(day(oct(16))).toHaveTextContent('16UpcomingFooting récupération')
    expect(day(oct(12))).toHaveTextContent('12UnplannedRun')
    expect(day(oct(13))).toHaveTextContent(/^13$/)
  })

  it('cas 4 : une sortie Strava non rattachée ne rattrape pas la séance du jour, mais peut lui être rattachée', () => {
    const { day } = renderCalendar()

    expect(day(oct(11))).toHaveTextContent('11MissedSortie longue 1 h 30')
    fireEvent.click(day(oct(11)))
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByRole('heading', { name: 'Sortie longue 1 h 30' })).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Assign Strava activity' })).toBeInTheDocument()
  })

  it('cas 5 : une sortie commencée à 0 h 15 reste sur son jour, pas sur la veille', () => {
    const { day } = renderCalendar()

    expect(day(oct(10))).toHaveTextContent('10UnplannedRun')
    expect(day(oct(9))).toHaveTextContent(/^9$/)
  })

  it('cas 6 : la semaine du jour est sélectionnée par défaut', () => {
    const { weeks } = renderCalendar()
    const panel = screen.getByRole('complementary')

    expect(weeks[2]).toHaveAttribute('aria-pressed', 'true')
    expect(within(panel).getByRole('heading', { level: 2 })).toHaveTextContent('Oct 12 – Oct 18')
    expect(panel).toHaveTextContent('This week')
    expect(panel).toHaveTextContent('1 active day out of 7')
    expect(stat(panel, 'Activities')).toBe('1')
    expect(stat(panel, 'Planned')).toBe('2')
    expect(stat(panel, 'To come')).toBe('2')
  })

  it('cas 7 : la semaine du 5 au 11 totalise volume et suivi du plan', () => {
    const { weeks } = renderCalendar()
    fireEvent.click(weeks[1])
    const panel = screen.getByRole('complementary')

    expect(within(panel).getByRole('heading', { level: 2 })).toHaveTextContent('Oct 5 – Oct 11')
    expect(panel).toHaveTextContent('3 active days out of 7')
    expect(stat(panel, 'Distance')).toBe('54.2 km')
    expect(stat(panel, 'Time')).toBe("2h40'")
    expect(stat(panel, 'Activities')).toBe('3')
    expect(stat(panel, 'Longest')).toBe('40.0 km')
    expect(stat(panel, 'Planned')).toBe('3')
    expect(stat(panel, 'Done')).toBe('1')
    expect(stat(panel, 'Missed')).toBe('2')
    expect(stat(panel, 'To come')).toBe('0')
  })

  it('cas 8 : la FC moyenne de la semaine est pondérée par la durée', () => {
    const { weeks } = renderCalendar()
    fireEvent.click(weeks[1])
    const panel = screen.getByRole('complementary')

    // (142 × 2700 + 150 × 1500 + 128 × 5400) / 9600 = 135,4 ; la moyenne
    // simple des trois sorties donnerait 140.
    expect(stat(panel, 'Avg HR')).toBe('135 bpm')
    expect(stat(panel, 'Max HR')).toBe('172 bpm')
  })

  it('cas 9 : « running » (.fit) et « Run » (Strava) comptent pour un seul sport', () => {
    const { weeks } = renderCalendar()
    fireEvent.click(weeks[1])
    const rows = within(screen.getByRole('complementary')).getAllByRole('row').slice(1)

    expect(rows.map((r) => r.textContent)).toEqual(["Ride140.0 km1h30'", "Run214.2 km1h10'"])
  })

  it('cas 10 : une semaine sans séance ni sortie le dit', () => {
    const { weeks } = renderCalendar()
    fireEvent.click(weeks[3])
    const panel = screen.getByRole('complementary')

    expect(within(panel).getByRole('heading', { level: 2 })).toHaveTextContent('Oct 19 – Oct 25')
    expect(panel).toHaveTextContent('No workouts or activities this week.')
  })

  it('cas 11 : les totaux du mois ignorent les jours des mois voisins, la semaine les compte', () => {
    const { entries, weeks } = renderCalendar()
    const month = buildMonthSummary(entries)

    expect(formatDistance(month.distanceM, 'en')).toBe('60.2 km')
    expect(formatDuration(month.durationSec)).toBe("3h10'")
    expect(month.activityCount).toBe(4)
    // La sortie du 29 septembre compte dans sa semaine, affichée en tête de grille.
    expect(weeks[0]).toHaveTextContent('8.0 km')
  })

  it('cas 12 : un paramètre ?month= invalide affiche le mois courant', () => {
    expect(parseMonthParam('2026-10', NOW)).toEqual(MONTH)
    for (const raw of ['2026-13', '2026-00', 'abc']) {
      expect(parseMonthParam(raw, NOW)).toEqual(MONTH)
    }
  })

  it('cas 13 : la grille s’adapte au mois, de 4 à 6 semaines', () => {
    // Février 2027 commence un lundi et compte 28 jours ; août 2026 commence
    // un samedi et compte 31 jours.
    expect(getMonthGridDays(new Date(2027, 1, 1))).toHaveLength(28)
    expect(getMonthGridDays(new Date(2026, 7, 1))).toHaveLength(42)
  })
})
