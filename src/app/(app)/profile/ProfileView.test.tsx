import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { UserProfile } from '@/lib/types'
import { ProfileView } from './ProfileView'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }))

const user: UserProfile = {
  id: 'u1',
  email: 'athlete@test.dev',
  role: 'ATHLETE',
  firstName: 'Ada',
  lastName: 'Runner',
  createdAt: '2026-08-01T00:00:00.000Z',
  athleteProfile: null,
}

function renderProfile(stravaBanner: 'reconnect' | null, stravaConnected = true) {
  render(<ProfileView user={user} coach={null} stravaConnected={stravaConnected} stravaBanner={stravaBanner} />)
}

describe('ProfileView — connexion Strava à renouveler', () => {
  it('T21 — arrivée depuis le tableau de bord : le bouton de reconnexion a le focus', () => {
    renderProfile('reconnect')

    expect(screen.getByRole('alert')).toHaveTextContent('Your Strava connection has expired')
    expect(screen.getByRole('button', { name: 'Reconnect Strava' })).toHaveFocus()
    // L'issue pour qui ne veut plus de Strava : sinon, chaque visite du
    // tableau de bord le ramènerait ici.
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeEnabled()
  })

  it('T21 — la reconnexion relance l’autorisation ; un échec est annoncé', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 502 }))
    vi.stubGlobal('fetch', fetchMock)
    renderProfile('reconnect')

    fireEvent.click(screen.getByRole('button', { name: 'Reconnect Strava' }))

    expect(await screen.findByText("Couldn't start the Strava connection. Try again.")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/strava/authorize', undefined)
    expect(screen.getByRole('button', { name: 'Reconnect Strava' })).toBeEnabled()
  })

  it('sans ?strava=reconnect : aucune invitation à reconnecter', () => {
    renderProfile(null)

    expect(screen.queryByRole('button', { name: 'Reconnect Strava' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('Strava déjà déconnecté : plus rien à renouveler, le bouton Connect suffit', () => {
    renderProfile('reconnect', false)

    expect(screen.queryByRole('button', { name: 'Reconnect Strava' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
  })
})
