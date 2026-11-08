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

  it('T06/T20 — ?reason=expired : explique pourquoi l’athlète doit se reconnecter', () => {
    navigation.search = 'redirect=%2Fprofile&reason=expired'
    render(<LoginView />)

    expect(screen.getByRole('status')).toHaveTextContent('Your session has expired.')
  })

  it('sans ?reason : aucun message de session', () => {
    render(<LoginView />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('LoginView — messages d’erreur', () => {
  beforeEach(() => {
    navigation.push.mockReset()
    navigation.search = ''
  })

  it('champs vides : erreur reliée à chaque champ, focus sur le premier, aucun appel', () => {
    const fetchMock = stubLogin(Response.json(athleteUser))
    render(<LoginView />)
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    const email = screen.getByLabelText('Email')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Enter your email.')
    expect(email).toHaveFocus()
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Enter your password.')
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('les champs obligatoires sont signalés comme tels', () => {
    render(<LoginView />)
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Password')).toBeRequired()
  })

  it('inscription : mot de passe trop court refusé avant l’API', () => {
    const fetchMock = stubLogin(Response.json(athleteUser))
    render(<LoginView />)
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.dev' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'court' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Use at least 8 characters.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('inscription refusée par l’API : message propre à l’inscription, annoncé', async () => {
    stubLogin(Response.json({ message: 'Un compte existe déjà avec cet email' }, { status: 409 }))
    render(<LoginView />)
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pris@test.dev' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /health data/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't create your account.")
    expect(navigation.push).not.toHaveBeenCalled()
  })

  it('T27 — mot de passe refusé par l’API : chaque raison sur le champ, qui reçoit le focus', async () => {
    stubLogin(
      Response.json(
        {
          message: 'Choose another password.',
          reasons: ['Too weak: use at least 8 characters.', 'Too common or predictable.'],
        },
        { status: 400 },
      ),
    )
    render(<LoginView />)
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'camille@test.dev' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'azerty123' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /health data/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    const password = screen.getByLabelText('Password')
    await waitFor(() => expect(password).toHaveAccessibleDescription(/Too weak.*Too common or predictable/))
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveFocus()
    expect(navigation.push).not.toHaveBeenCalled()
  })

  it('T28 — compte verrouillé : le délai est annoncé', async () => {
    stubLogin(Response.json({ message: 'Too many attempts. Try again in 14 min.' }, { status: 429 }))
    render(<LoginView />)
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts. Try again in 14 min.')
    expect(navigation.push).not.toHaveBeenCalled()
  })

  it('le passage à l’inscription est un bouton, pas un lien vers « # »', () => {
    render(<LoginView />)
    expect(screen.queryByRole('link', { name: 'Create an account' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('inscription sans consentement aux données de santé : refusée avant l’API, annoncée', () => {
    const fetchMock = stubLogin(Response.json(athleteUser))
    render(<LoginView />)
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.dev' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    const consent = screen.getByRole('checkbox', { name: /health data/ })
    expect(consent).toBeRequired()
    expect(consent).toHaveAttribute('aria-invalid', 'true')
    expect(consent).toHaveAccessibleDescription(/Tick this box to create your account/)
    expect(consent).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('T24 — inscription avec consentement : l’accord est transmis à l’API, qui le date', async () => {
    const fetchMock = stubLogin(Response.json(athleteUser))
    render(<LoginView />)
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.dev' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /health data/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/dashboard'))
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/auth/register')
    expect(JSON.parse(String(init.body))).toMatchObject({ role: 'ATHLETE', healthDataConsent: true })
  })

  it('T25 — après la suppression du compte, l’écran de connexion le confirme', () => {
    navigation.search = 'reason=deleted'
    render(<LoginView />)

    expect(screen.getByRole('status')).toHaveTextContent('Your account and all its data have been deleted.')
  })

  it('le lien vers la politique de confidentialité s’ouvre dans un nouvel onglet, et le dit', () => {
    render(<LoginView />)
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    const link = screen.getByRole('link', { name: 'privacy policy (opens in a new tab)' })
    expect(link).toHaveAttribute('href', '/privacy')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
