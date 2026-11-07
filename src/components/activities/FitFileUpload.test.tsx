import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FitFileUpload } from './FitFileUpload'

// T22 — rattacher le .fit de la montre à une activité importée de Strava.

const ACTIVITY_ID = 'act-strava-1'
const RELOADED = { id: ACTIVITY_ID, laps: [{ index: 0, intensity: 'ACTIVE' }] }

// Simule les deux Route Handlers appelés : l'envoi du fichier, puis le
// rechargement de l'activité dont l'API vient de remplacer les laps.
function stubApi(
  onAttach: () => Response | Promise<Response>,
  onReload: () => Response = () => Response.json(RELOADED),
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === `/api/activities/${ACTIVITY_ID}/fit` && init?.method === 'POST') return onAttach()
    if (url === `/api/activities/${ACTIVITY_ID}`) return onReload()
    throw new Error(`Appel inattendu : ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Le champ fichier est masqué derrière le bouton « Attach .fit file ».
function selectFile(container: HTMLElement, file = new File([new Uint8Array([14, 16, 0, 0])], 'piste.fit')) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('Champ fichier introuvable')
  fireEvent.change(input, { target: { files: [file] } })
  return file
}

function renderUpload() {
  const onAttached = vi.fn()
  const { container } = render(<FitFileUpload activityId={ACTIVITY_ID} onAttached={onAttached} />)
  return { container, onAttached }
}

describe('FitFileUpload', () => {
  it('n’accepte que des fichiers .fit', () => {
    const { container } = renderUpload()
    expect(container.querySelector('input[type="file"]')).toHaveAttribute('accept', '.fit')
  })

  it('envoie le fichier, puis transmet l’activité rechargée', async () => {
    const fetchMock = stubApi(() => Response.json({ ok: true }))
    const { container, onAttached } = renderUpload()

    const file = selectFile(container)

    await waitFor(() => expect(onAttached).toHaveBeenCalledWith(RELOADED))
    const [, init] = fetchMock.mock.calls[0]
    expect((init?.body as FormData).get('file')).toBe(file)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('désactive le bouton pendant l’envoi', async () => {
    let finish: (res: Response) => void = () => {}
    stubApi(() => new Promise<Response>((resolve) => (finish = resolve)))
    const { container } = renderUpload()

    selectFile(container)

    const button = await screen.findByRole('button', { name: 'Uploading…' })
    expect(button).toBeDisabled()
    finish(Response.json({ ok: true }))
    expect(await screen.findByRole('button', { name: 'Attach .fit file' })).toBeEnabled()
  })

  it('409 : fichier déjà rattaché, sans reprendre le message de l’API', async () => {
    stubApi(() => Response.json({ message: 'Ce fichier est déjà rattaché à une activité' }, { status: 409 }))
    const { container, onAttached } = renderUpload()

    selectFile(container)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This .fit file is already attached, to this activity or another one.',
    )
    expect(screen.queryByText(/déjà rattaché/)).not.toBeInTheDocument()
    expect(onAttached).not.toHaveBeenCalled()
  })

  it('400 : fichier illisible ou qui ne correspond pas à l’activité', async () => {
    stubApi(() => Response.json({ message: 'Heure de départ différente' }, { status: 400 }))
    const { container } = renderUpload()

    selectFile(container)

    expect(await screen.findByRole('alert')).toHaveTextContent(/unreadable, has no laps, or doesn't match/)
  })

  it('autre erreur : message générique', async () => {
    stubApi(() => new Response(null, { status: 502 }))
    const { container } = renderUpload()

    selectFile(container)

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't attach the .fit file. Try again.")
  })

  it('fichier rattaché mais activité non rechargée : invite à rafraîchir', async () => {
    stubApi(
      () => Response.json({ ok: true }),
      () => new Response(null, { status: 500 }),
    )
    const { container, onAttached } = renderUpload()

    selectFile(container)

    expect(await screen.findByRole('alert')).toHaveTextContent(/File attached, but the activity couldn't be reloaded/)
    expect(onAttached).not.toHaveBeenCalled()
  })
})
