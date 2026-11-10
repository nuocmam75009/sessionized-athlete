import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkoutModal } from './WorkoutModal'
import type { DayEntry } from '@/lib/calendar'
import type { Workout } from '@/lib/types'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))

const XSS_TITLE = '<img src=x onerror=alert(1)>'

function workout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'wk-1',
    planId: 'plan-1',
    title: 'Footing',
    scheduledDate: '2026-08-04T07:00:00.000Z',
    coachNote: null,
    targetDistanceM: 10000,
    targetDurationSec: null,
    targetHeartRateZone: null,
    laps: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

function dayEntry(overrides: Partial<DayEntry> = {}): DayEntry {
  return {
    dateParam: '2026-08-04',
    dayNumber: 4,
    isToday: false,
    isInCurrentMonth: true,
    workout: null,
    linkedActivity: null,
    unplannedActivities: [],
    activities: [],
    status: 'empty',
    distanceM: 0,
    durationSec: 0,
    activityCount: 0,
    ...overrides,
  }
}

describe('WorkoutModal', () => {
  it('T16 — affiche comme texte un titre et une note piégés par le coach', () => {
    render(
      <WorkoutModal
        entry={dayEntry({
          status: 'missed',
          workout: workout({ title: XSS_TITLE, coachNote: '<script>window.__xss = 1</script>' }),
        })}
        onClose={vi.fn()}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: XSS_TITLE })).toBeInTheDocument()
    expect(within(dialog).getByText(/<script>window.__xss = 1<\/script>/)).toBeInTheDocument()
    // Aucune balise interprétée : ni image injectée, ni script.
    expect(dialog.querySelector('img, script')).toBeNull()
  })

  it('propose l’import pour une séance manquée, avec la séance présélectionnée', () => {
    render(<WorkoutModal entry={dayEntry({ status: 'missed', workout: workout() })} onClose={vi.fn()} />)
    expect(screen.getByRole('link', { name: 'Upload activity' })).toHaveAttribute(
      'href',
      '/activities/upload?workoutId=wk-1',
    )
  })

  it('indique un jour sans rien de prévu', () => {
    render(<WorkoutModal entry={dayEntry()} onClose={vi.fn()} />)
    expect(screen.getByText('Nothing planned for this day.')).toBeInTheDocument()
  })

  it('se ferme avec Échap et place le focus sur le bouton de fermeture', () => {
    const onClose = vi.fn()
    render(<WorkoutModal entry={dayEntry()} onClose={onClose} />)

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
