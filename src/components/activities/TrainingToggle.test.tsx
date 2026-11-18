import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TrainingToggle } from './TrainingToggle'
import type { Activity } from '@/lib/types'

const ACTIVITY = {
  id: 'act-1',
  training: false,
} as Activity

function stubPatch(respond: () => Response) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === '/api/activities/act-1' && init?.method === 'PATCH') return respond()
    throw new Error(`Appel inattendu : ${String(input)}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('TrainingToggle', () => {
  it('reflète le flag de l’activité et explique à quoi il sert', () => {
    render(<TrainingToggle activity={ACTIVITY} prescribedByCoach={false} onSaved={vi.fn()} />)

    expect(screen.getByRole('switch', { name: 'Quality session' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText(/compared with your other quality sessions/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'See the analysis' })).not.toBeInTheDocument()
  })

  it('rappelle le choix du coach quand le workout lié est une séance de qualité', () => {
    render(<TrainingToggle activity={ACTIVITY} prescribedByCoach onSaved={vi.fn()} />)
    expect(screen.getByText('Planned as a quality session by your coach.')).toBeInTheDocument()
  })

  it('bascule le flag par PATCH et transmet l’activité renvoyée', async () => {
    const updated = { ...ACTIVITY, training: true }
    const fetchMock = stubPatch(() => Response.json(updated))
    const onSaved = vi.fn()
    const { rerender } = render(<TrainingToggle activity={ACTIVITY} prescribedByCoach={false} onSaved={onSaved} />)

    fireEvent.click(screen.getByRole('switch', { name: 'Quality session' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(updated))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ training: true })

    rerender(<TrainingToggle activity={updated} prescribedByCoach={false} onSaved={onSaved} />)
    expect(screen.getByRole('switch', { name: 'Quality session' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('link', { name: 'See the analysis' })).toHaveAttribute('href', '/trainings')
  })

  it('signale un échec sans changer l’état', async () => {
    stubPatch(() => Response.json({ message: 'Erreur' }, { status: 500 }))
    const onSaved = vi.fn()
    render(<TrainingToggle activity={ACTIVITY} prescribedByCoach={false} onSaved={onSaved} />)

    fireEvent.click(screen.getByRole('switch', { name: 'Quality session' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't update this activity. Try again.")
    expect(onSaved).not.toHaveBeenCalled()
    expect(screen.getByRole('switch', { name: 'Quality session' })).toHaveAttribute('aria-checked', 'false')
  })
})
