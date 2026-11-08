import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountDataActions } from './AccountDataActions'

// T25 — droits d'accès et de portabilité (export) et droit à l'effacement
// (suppression du compte), depuis le profil.

const navigation = vi.hoisted(() => ({ hardNavigate: vi.fn() }))
vi.mock('@/lib/hard-navigate', () => navigation)

type Handler = (init?: RequestInit) => Response | Promise<Response>

function stubApi({ onExport, onDelete }: { onExport?: Handler; onDelete?: Handler }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === '/api/users/me/export' && onExport) return onExport(init)
    if (url === '/api/users/me' && init?.method === 'DELETE' && onDelete) return onDelete(init)
    throw new Error(`Appel inattendu : ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function openDeleteDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
  return screen.getByRole('dialog', { name: 'Delete your account' })
}

function confirmDeletion(password: string) {
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
  const dialog = screen.getByRole('dialog')
  const submit = Array.from(dialog.querySelectorAll('button[type="submit"]'))[0]
  if (!(submit instanceof HTMLButtonElement)) throw new Error('Bouton de confirmation introuvable')
  fireEvent.click(submit)
}

describe('AccountDataActions', () => {
  beforeEach(() => navigation.hardNavigate.mockReset())

  describe('export des données', () => {
    it('télécharge le fichier JSON sous le nom proposé par le serveur', async () => {
      const createObjectURL = vi.fn(() => 'blob:export')
      const revokeObjectURL = vi.fn()
      // jsdom n'implémente pas les URL de Blob : sous-classe remplacée le
      // temps du test (unstubAllGlobals rend l'originale).
      vi.stubGlobal(
        'URL',
        class extends URL {
          static createObjectURL = createObjectURL
          static revokeObjectURL = revokeObjectURL
        },
      )
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      stubApi({
        onExport: () =>
          new Response('{"format":"sessionized-export/2"}', {
            headers: { 'Content-Disposition': 'attachment; filename="sessionized-export-2026-11-08.json"' },
          }),
      })
      render(<AccountDataActions />)

      fireEvent.click(screen.getByRole('button', { name: 'Download my data' }))

      await waitFor(() => expect(click).toHaveBeenCalled())
      const link = click.mock.contexts[0] as HTMLAnchorElement
      expect(link.download).toBe('sessionized-export-2026-11-08.json')
      expect(link.href).toBe('blob:export')
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:export')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('échec côté serveur : message, et le bouton redevient utilisable', async () => {
      stubApi({ onExport: () => Response.json({ message: 'Export failed' }, { status: 502 }) })
      render(<AccountDataActions />)

      fireEvent.click(screen.getByRole('button', { name: 'Download my data' }))

      expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't prepare your data. Try again.")
      expect(screen.getByRole('button', { name: 'Download my data' })).toBeEnabled()
    })
  })

  describe('suppression du compte', () => {
    it('demande une confirmation dans une modale, sans rien envoyer à l’ouverture', () => {
      const fetchMock = stubApi({})
      render(<AccountDataActions />)

      const dialog = openDeleteDialog()

      expect(dialog).toHaveTextContent("This can't be undone.")
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('mot de passe vide : refusé sur place, focus sur le champ', () => {
      const fetchMock = stubApi({})
      render(<AccountDataActions />)
      openDeleteDialog()

      confirmDeletion('')

      const password = screen.getByLabelText('Password')
      expect(password).toHaveAttribute('aria-invalid', 'true')
      expect(password).toHaveAccessibleDescription('Enter your password.')
      expect(password).toHaveFocus()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('bon mot de passe : envoyé en DELETE, puis retour à l’écran de connexion', async () => {
      const fetchMock = stubApi({ onDelete: () => new Response(null, { status: 204 }) })
      render(<AccountDataActions />)
      openDeleteDialog()

      confirmDeletion('Passw0rd!')

      await waitFor(() => expect(navigation.hardNavigate).toHaveBeenCalledWith('/login?reason=deleted'))
      const [, init] = fetchMock.mock.calls[0]
      expect(JSON.parse(String(init?.body))).toEqual({ password: 'Passw0rd!' })
    })

    it('mot de passe incorrect (403) : signalé sur le champ, la session n’est pas touchée', async () => {
      stubApi({ onDelete: () => Response.json({ message: 'Mot de passe incorrect' }, { status: 403 }) })
      render(<AccountDataActions />)
      openDeleteDialog()

      confirmDeletion('mauvais')

      const password = screen.getByLabelText('Password')
      await waitFor(() => expect(password).toHaveAccessibleDescription('Incorrect password.'))
      expect(password).toHaveFocus()
      expect(navigation.hardNavigate).not.toHaveBeenCalled()
      // Le message de l'API, en français, n'est jamais affiché tel quel.
      expect(screen.getByRole('dialog')).not.toHaveTextContent('Mot de passe incorrect')
    })

    it.each([
      [429, 'Too many attempts. Wait a minute, then try again.'],
      [502, "Couldn't delete your account. Try again."],
    ])('HTTP %i : message adapté, compte conservé', async (status, message) => {
      stubApi({ onDelete: () => Response.json({ message: 'erreur' }, { status }) })
      render(<AccountDataActions />)
      openDeleteDialog()

      confirmDeletion('Passw0rd!')

      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(navigation.hardNavigate).not.toHaveBeenCalled()
    })

    it('Cancel ferme la modale sans rien supprimer', () => {
      const fetchMock = stubApi({})
      render(<AccountDataActions />)
      openDeleteDialog()

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
