import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadView } from './UploadView'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
// La carte charge Leaflet et MapLibre, inutiles ici et sans WebGL sous jsdom.
vi.mock('@/components/ui/RouteMap', () => ({ RouteMap: () => <div data-testid="route-map" /> }))

type UploadResponder = (body: FormData) => Response

// Simule les deux Route Handlers appelés par la vue : la liste des séances au
// montage, puis l'envoi du fichier.
function stubApi(onUpload: UploadResponder = () => Response.json({ id: 'act-new' }, { status: 201 })) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === '/api/workouts') return Response.json([])
    if (url === '/api/activities/upload') return onUpload(init?.body as FormData)
    throw new Error(`Appel inattendu : ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function fitFile(name = 'sortie.fit') {
  return new File([new Uint8Array([14, 16, 0, 0])], name)
}

function drop(files: File[]) {
  // L'événement remonte jusqu'au conteneur qui porte onDrop.
  const zone = screen.getByText(/drag your \.fit and \.gpx files here/i)
  fireEvent.drop(zone, { dataTransfer: { files } })
}

function confirm() {
  fireEvent.click(screen.getByRole('button', { name: 'Confirm & save' }))
}

describe('UploadView — sélection des fichiers', () => {
  beforeEach(() => {
    push.mockReset()
    stubApi()
  })

  it('T11 — refuse un .gpx sans .fit', () => {
    render(<UploadView />)
    drop([new File(['<gpx/>'], 'trace.gpx')])
    expect(screen.getByText(/a \.fit file is required/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm & save' })).not.toBeInTheDocument()
  })

  it('T12 — refuse trois fichiers', () => {
    render(<UploadView />)
    drop([fitFile('a.fit'), new File(['<gpx/>'], 'b.gpx'), new File(['x'], 'c.gpx')])
    expect(screen.getByText(/at most two files/i)).toBeInTheDocument()
  })

  it('refuse deux .fit', () => {
    render(<UploadView />)
    drop([fitFile('a.fit'), fitFile('b.fit')])
    expect(screen.getByText('Only one .fit file at a time.')).toBeInTheDocument()
  })

  it('refuse une extension hors .fit/.gpx', () => {
    render(<UploadView />)
    drop([new File(['MZ'], 'setup.exe')])
    expect(screen.getByText('Accepted formats: .fit and .gpx.')).toBeInTheDocument()
  })

  it('accepte un .fit seul, extension insensible à la casse', () => {
    render(<UploadView />)
    drop([fitFile('SORTIE.FIT')])
    expect(screen.getByText('SORTIE.FIT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm & save' })).toBeEnabled()
  })

  it('accepte un .fit et un .gpx ensemble et prévisualise le tracé', async () => {
    render(<UploadView />)
    drop([fitFile(), new File(['<gpx/>'], 'trace.gpx')])
    expect(await screen.findByTestId('route-map')).toBeInTheDocument()
  })
})

describe('UploadView — envoi', () => {
  beforeEach(() => push.mockReset())

  it('T09 — envoie le .fit et la séance choisie, puis revient au calendrier', async () => {
    let sent: FormData | undefined
    stubApi((body) => {
      sent = body
      return Response.json({ id: 'act-new' }, { status: 201 })
    })
    render(<UploadView initialWorkoutId="wk-42" />)
    drop([fitFile()])
    confirm()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
    expect((sent?.get('file') as File).name).toBe('sortie.fit')
    expect(sent?.get('workoutId')).toBe('wk-42')
  })

  it('T10 — signale le doublon (409) sans proposer de réessayer', async () => {
    stubApi(() => Response.json({ statusCode: 409, message: 'Cette activité a déjà été importée' }, { status: 409 }))
    render(<UploadView />)
    drop([fitFile()])
    confirm()

    expect(await screen.findByText('This activity has already been uploaded.')).toBeInTheDocument()
    // Le texte de l'API (en français) n'est pas repris dans l'interface.
    expect(screen.queryByText('Cette activité a déjà été importée')).not.toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it('T13 — signale un fichier corrompu (400), sans planter', async () => {
    stubApi(() => Response.json({ statusCode: 400, message: 'Fichier .fit invalide ou corrompu' }, { status: 400 }))
    render(<UploadView />)
    drop([fitFile('setup.fit')])
    confirm()

    expect(await screen.findByText('This .fit file is invalid or corrupted.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm & save' })).toBeEnabled()
  })

  it('garde un message générique si l’API ne renvoie pas de JSON', async () => {
    stubApi(() => new Response('<html>Bad Gateway</html>', { status: 502 }))
    render(<UploadView />)
    drop([fitFile()])
    confirm()

    expect(await screen.findByText('Upload failed. Try again.')).toBeInTheDocument()
  })

  // Valeurs limites de la difficulté (1–10, entier).
  it.each(['0', '11', '5.5'])('refuse la difficulté %s sans appeler l’API', async (value) => {
    const fetchMock = stubApi()
    render(<UploadView />)
    drop([fitFile()])
    fireEvent.change(screen.getByLabelText(/difficulty/i), { target: { value } })
    confirm()

    expect(await screen.findByText('Difficulty must be a whole number from 1 to 10.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalledWith('/api/activities/upload', expect.anything())
  })

  it.each(['1', '10'])('accepte la difficulté %s', async (value) => {
    let sent: FormData | undefined
    stubApi((body) => {
      sent = body
      return Response.json({ id: 'act-new' }, { status: 201 })
    })
    render(<UploadView />)
    drop([fitFile()])
    fireEvent.change(screen.getByLabelText(/difficulty/i), { target: { value } })
    confirm()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
    expect(sent?.get('difficultyNote')).toBe(value)
  })
})
