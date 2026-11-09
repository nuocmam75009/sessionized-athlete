import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LapAnalysis } from './LapAnalysis'
import type { Lap, TrackPoint } from '@/lib/types'

// T33 — graphe d'allure d'une séance et sélection de laps. Recharts ne dessine
// rien dans jsdom (aucune dimension) : le graphe lui-même est vérifié par
// Playwright, ici on teste la sélection, le tableau et la synthèse.

function lap(overrides: Partial<Lap> & Pick<Lap, 'id' | 'index'>): Lap {
  return {
    activityId: 'act-1',
    distanceM: 300,
    durationSec: 60,
    startElapsedSec: null,
    avgPaceSecPerKm: 200,
    avgHeartRate: 160,
    maxHeartRate: 170,
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

// Fractionné : deux répétitions séparées par une récupération, laps renvoyés
// dans le désordre comme l'API peut le faire.
const INTERVAL_LAPS: Lap[] = [
  lap({ id: 'r2', index: 2, intensity: 'INTERVAL', distanceM: 300, durationSec: 60, avgHeartRate: 170, maxHeartRate: 178 }),
  lap({ id: 'r1', index: 0, intensity: 'INTERVAL', distanceM: 300, durationSec: 60, avgHeartRate: 160, maxHeartRate: 172 }),
  lap({ id: 'rec', index: 1, intensity: 'RECOVERY', distanceM: 100, durationSec: 60, avgHeartRate: 150 }),
]

function renderLaps(laps = INTERVAL_LAPS, trackPoints: TrackPoint[] | null = null, lapTimesExcludePauses = false) {
  return render(<LapAnalysis laps={laps} trackPoints={trackPoints} lapTimesExcludePauses={lapTimesExcludePauses} />)
}

const summary = () => screen.getByText(/selected$|combined totals/).closest('[aria-live]') as HTMLElement

describe('LapAnalysis', () => {
  it('T33 — ouvre un fractionné sur ses répétitions sélectionnées, avec leurs totaux', () => {
    renderLaps()

    expect(screen.getByRole('checkbox', { name: 'Select lap 1' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Select lap 2' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Select lap 3' })).toBeChecked()

    const totals = within(summary())
    expect(totals.getByText('2 laps selected')).toBeInTheDocument()
    expect(totals.getByText('0.6 km')).toBeInTheDocument()
    expect(totals.getByText(`2'00"`)).toBeInTheDocument()
    expect(totals.getByText(`3'20"/km`)).toBeInTheDocument()
    expect(totals.getByText('165bpm')).toBeInTheDocument()
    expect(totals.getByText('178bpm')).toBeInTheDocument()
  })

  it('T33 — un clic sur la ligne ou sur la case bascule le lap, une seule fois', () => {
    renderLaps()
    const recovery = screen.getByRole('checkbox', { name: 'Select lap 2' })

    fireEvent.click(recovery.closest('tr') as HTMLElement)
    expect(recovery).toBeChecked()
    expect(within(summary()).getByText('3 laps selected')).toBeInTheDocument()

    // La case est dans la ligne : son clic ne doit pas remonter et annuler
    // aussitôt la bascule.
    fireEvent.click(recovery)
    expect(recovery).not.toBeChecked()
    expect(within(summary()).getByText('2 laps selected')).toBeInTheDocument()
  })

  it('T33 — « Clear selection » puis « Select work laps »', () => {
    renderLaps()
    expect(screen.queryByRole('button', { name: 'Select work laps' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(screen.getAllByRole('checkbox').filter((box) => (box as HTMLInputElement).checked)).toHaveLength(0)
    expect(within(summary()).getByText('Select laps to see their combined totals.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Select work laps' }))
    expect(within(summary()).getByText('2 laps selected')).toBeInTheDocument()
  })

  it('ne sélectionne rien d’office sur une sortie régulière', () => {
    renderLaps([lap({ id: 'a', index: 0, intensity: 'ACTIVE' }), lap({ id: 'b', index: 1, intensity: 'ACTIVE' })])

    expect(screen.getAllByRole('checkbox').some((box) => (box as HTMLInputElement).checked)).toBe(false)
    expect(screen.queryByRole('button', { name: 'Select work laps' })).not.toBeInTheDocument()
  })

  it('affiche le graphe dès qu’il y a une trace, et dit quand la position des laps est estimée', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    const track = [0, 1, 2].map(
      (i) => ({ id: `tp-${i}`, elapsedSec: i, speedMPerSec: 4, distanceM: i * 4 }) as TrackPoint,
    )

    renderLaps(INTERVAL_LAPS, track, true)

    expect(screen.getByRole('heading', { name: 'Pace' })).toBeInTheDocument()
    expect(screen.getByText(/Lap positions are estimated/)).toBeInTheDocument()
  })

  it('sans trace exploitable, pas de graphe', () => {
    renderLaps(INTERVAL_LAPS, [])
    expect(screen.queryByRole('heading', { name: 'Pace' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Laps' })).toBeInTheDocument()
  })
})
