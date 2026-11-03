import { http, HttpResponse } from 'msw'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { POST } from '@/app/api/activities/upload/route'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { API_URL, backend, validToken } from './support/backend'
import { cookieJar } from './support/cookies'

const token = validToken()

function uploadRequest(file: File, fields: Record<string, string> = {}) {
  const form = new FormData()
  form.append('file', file)
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return new NextRequest('http://localhost:3000/api/activities/upload', { method: 'POST', body: form })
}

const fitFile = () => new File([new Uint8Array([14, 16, 0, 0, 0, 0, 0, 0, 46, 70, 73, 84])], 'sortie.fit')

describe('POST /api/activities/upload', () => {
  beforeEach(() => cookieJar.reset({ [SESSION_COOKIE_NAME]: token }))

  it('refuse sans cookie de session, sans appeler le backend', async () => {
    cookieJar.reset()
    // Aucune route déclarée : un appel au backend ferait échouer le test.
    const res = await POST(uploadRequest(fitFile()))
    expect(res.status).toBe(401)
  })

  it('T09 — transmet le fichier en multipart avec le jeton Bearer, renvoie 201', async () => {
    let authorization: string | null = null
    let received: FormData | undefined
    backend.use(
      http.post(`${API_URL}/activities/upload`, async ({ request }) => {
        authorization = request.headers.get('authorization')
        received = await request.formData()
        return HttpResponse.json({ id: 'act-new', source: 'FIT', trackPointsCount: 3600 }, { status: 201 })
      }),
    )

    const res = await POST(uploadRequest(fitFile(), { workoutId: 'wk-1' }))

    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ id: 'act-new', source: 'FIT' })
    expect(authorization).toBe(`Bearer ${token}`)
    expect((received?.get('file') as File).name).toBe('sortie.fit')
    expect(received?.get('workoutId')).toBe('wk-1')
  })

  it('T10 — relaie le 409 du doublon avec son message', async () => {
    backend.use(
      http.post(`${API_URL}/activities/upload`, () =>
        HttpResponse.json({ statusCode: 409, message: 'Cette activité a déjà été importée' }, { status: 409 }),
      ),
    )

    const res = await POST(uploadRequest(fitFile()))

    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ message: 'Cette activité a déjà été importée' })
  })

  it('T13 — relaie le 400 d’un .exe renommé en .fit', async () => {
    backend.use(
      http.post(`${API_URL}/activities/upload`, () =>
        HttpResponse.json({ statusCode: 400, message: 'Fichier .fit invalide ou corrompu' }, { status: 400 }),
      ),
    )

    const res = await POST(uploadRequest(new File(['MZ\x90\x00'], 'setup.fit')))

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ message: 'Fichier .fit invalide ou corrompu' })
  })

  it('T13 — ne plante pas quand le backend répond autre chose que du JSON', async () => {
    backend.use(http.post(`${API_URL}/activities/upload`, () => new HttpResponse('<html>500</html>', { status: 500 })))

    const res = await POST(uploadRequest(fitFile()))

    expect(res.status).toBe(500)
    expect(await res.json()).toBeNull()
  })
})
