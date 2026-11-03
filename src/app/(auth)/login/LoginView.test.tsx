import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginView from './LoginView'

const navigation = vi.hoisted(() => ({ push: vi.fn(), search: '' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}))

function stubLogin(response: Response) {
  const fetchMock = vi.fn(async () => response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function submit(email = 'athlete@test.dev', password = 'Passw0rd!') {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
}

const athleteUser = { user: { sub: 'u1', email: 'athlete@test.dev', role: 'ATHLETE' } }

describe('LoginView', () => {
  beforeEach(() => {
    navigation.push.mockReset()
    navigation.search = ''
  })

  it('T01 — envoie les identifiants à la route interne et redirige vers /dashboard', async () => {
    const fetchMock = stubLogin(Response.json(athleteUser))
    render(<LoginView />)
    submit()

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/dashboard'))
    // Jamais le backend en direct : seule la route /api/auth/login peut poser
    // le cookie httpOnly.
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
  })

  it('conserve un chemin interne passé en ?redirect=', async () => {
    navigation.search = 'redirect=/profile'
    stubLogin(Response.json(athleteUser))
    render(<LoginView />)
    submit()

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/profile'))
  })

  // Même message que le compte existe ou non : l'interface ne doit pas
  // permettre d'énumérer les emails inscrits.
  it.each([401, 404])('T02 — message générique et aucune redirection (HTTP %i)', async (status) => {
    stubLogin(Response.json({ message: 'Invalid credentials' }, { status }))
    render(<LoginView />)
    submit('inconnu@test.dev', 'mauvais')

    expect(await screen.findByText("Couldn't log in. Check your email and password.")).toBeInTheDocument()
    expect(navigation.push).not.toHaveBeenCalled()
  })

  it.each(['//evil.example', '/\\evil.example'])('T04 — ?redirect=%s renvoie vers /dashboard', async (redirect) => {
    navigation.search = `redirect=${encodeURIComponent(redirect)}`
    stubLogin(Response.json(athleteUser))
    render(<LoginView />)
    submit()

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/dashboard'))
  })
})
