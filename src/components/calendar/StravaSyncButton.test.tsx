import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StravaSyncButton } from './StravaSyncButton'

// T17 / T21 — synchronisation Strava déclenchée par l'athlète depuis le calendrier.

// vi.hoisted : vi.mock est remonté avant les déclarations du fichier.
const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

function stubSync(respond: () => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === '/api/strava/sync' && init?.method === 'POST') return respond()
    throw new Error(`Appel inattendu : ${String(input)}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function clickSync() {
  fireEvent.click(screen.getByRole('button', { name: 'Sync Strava' }))
}

describe('StravaSyncButton', () => {
  beforeEach(() => {
    router.refresh.mockReset()
    router.push.mockReset()
  })

  it('n’appelle pas Strava tant que l’athlète ne clique pas', () => {
    const fetchMock = stubSync(() => Response.json({ importedCount: 0 }))
    render(<StravaSyncButton />)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('T17 — nouvelles activités : compteur annoncé et calendrier rechargé', async () => {
    stubSync(() => Response.json({ importedCount: 2 }, { status: 201 }))
    render(<StravaSyncButton />)

    clickSync()

    expect(await screen.findByRole('status')).toHaveTextContent('2 new activities imported.')
    expect(router.refresh).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Sync Strava' })).toBeEnabled()
  })

  it('rien de nouveau : « à jour »', async () => {
    stubSync(() => Response.json({ importedCount: 0 }, { status: 201 }))
    render(<StravaSyncButton />)

    clickSync()

    expect(await screen.findByRole('status')).toHaveTextContent('Already up to date.')
  })

  it('désactive le bouton pendant la synchronisation', async () => {
    let finish: (res: Response) => void = () => {}
    const fetchMock = stubSync(() => new Promise<Response>((resolve) => (finish = resolve)))
    render(<StravaSyncButton />)

    clickSync()

    const button = await screen.findByRole('button', { name: 'Syncing…' })
    expect(button).toBeDisabled()
    // Un second clic ne repart pas vers l'API.
    fireEvent.click(button)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    finish(Response.json({ importedCount: 1 }, { status: 201 }))
    expect(await screen.findByRole('status')).toHaveTextContent('1 new activity imported.')
  })

  it('T21 — connexion inutilisable (409) : envoi sur le bouton de reconnexion du profil', async () => {
    stubSync(() => Response.json({ code: 'STRAVA_RECONNECT_REQUIRED' }, { status: 409 }))
    render(<StravaSyncButton />)

    clickSync()

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/profile?strava=reconnect'))
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('quota Strava épuisé (503) : dit dans combien de temps réessayer, sans afficher le message de l’API', async () => {
    stubSync(() =>
      Response.json(
        { code: 'STRAVA_RATE_LIMITED', message: 'Limite de requêtes Strava atteinte', retryAfterSec: 540 },
        { status: 503 },
      ),
    )
    render(<StravaSyncButton />)

    clickSync()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("Strava's request limit is reached. Try again in 9 min.")
    expect(alert).not.toHaveTextContent('Limite')
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('panne passagère (502) ou réseau coupé : message générique, bouton réutilisable', async () => {
    stubSync(() => new Response(null, { status: 502 }))
    render(<StravaSyncButton />)

    clickSync()

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't sync with Strava. Try again.")
    expect(screen.getByRole('button', { name: 'Sync Strava' })).toBeEnabled()

    stubSync(() => Promise.reject(new TypeError('Failed to fetch')))
    clickSync()

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't sync with Strava. Try again.")
    expect(router.refresh).not.toHaveBeenCalled()
  })
})
