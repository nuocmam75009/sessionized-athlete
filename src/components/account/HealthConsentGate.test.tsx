import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthConsentGate } from './HealthConsentGate'

// T24 — consentement aux données de santé demandé aux comptes créés avant la
// case d'inscription.

const router = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

function stubConsent(respond: () => Response) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === '/api/users/me/health-consent' && init?.method === 'POST') return respond()
    throw new Error(`Appel inattendu : ${String(input)}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('HealthConsentGate', () => {
  beforeEach(() => router.refresh.mockReset())

  it('case non cochée : rien n’est envoyé, l’erreur est annoncée sur la case', () => {
    const fetchMock = stubConsent(() => Response.json({}))
    render(<HealthConsentGate />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    const consent = screen.getByRole('checkbox', { name: /health data/ })
    expect(consent).not.toBeChecked()
    expect(consent).toHaveAttribute('aria-invalid', 'true')
    expect(consent).toHaveAccessibleDescription('Tick this box to keep using Sessionized.')
    expect(consent).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('case cochée : l’accord est envoyé, puis la page demandée se recharge', async () => {
    const fetchMock = stubConsent(() => Response.json({ healthDataConsentAt: '2026-11-08T09:00:00.000Z' }))
    render(<HealthConsentGate />)

    fireEvent.click(screen.getByRole('checkbox', { name: /health data/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(String(init?.body))).toEqual({ healthDataConsent: true })
  })

  it('échec de l’enregistrement : message, et l’athlète peut réessayer', async () => {
    stubConsent(() => Response.json({ message: 'erreur' }, { status: 502 }))
    render(<HealthConsentGate />)

    fireEvent.click(screen.getByRole('checkbox', { name: /health data/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save your answer. Try again.")
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('refus possible : export et suppression du compte proposés sur le même écran', () => {
    render(<HealthConsentGate />)

    expect(screen.getByRole('heading', { name: "You don't agree?" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download my data' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete my account' })).toBeInTheDocument()
  })
})
