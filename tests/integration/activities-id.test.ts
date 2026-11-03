import { http, HttpResponse } from 'msw'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it } from 'vitest'
import * as analysisRoute from '@/app/api/activities/[id]/analysis/route'
import * as fitRoute from '@/app/api/activities/[id]/fit/route'
import * as gpxRoute from '@/app/api/activities/[id]/gpx/route'
import * as activityRoute from '@/app/api/activities/[id]/route'
import * as routeRoute from '@/app/api/activities/[id]/route/route'
import * as trackRoute from '@/app/api/activities/[id]/track/route'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { API_URL, backend, validToken } from './support/backend'
import { cookieJar } from './support/cookies'

const token = validToken()

type RouteContext = { params: Promise<{ id: string }> }
type Handler = (request: NextRequest, context: RouteContext) => Promise<Response>

function call(handler: Handler, method: string, id: string) {
  const body =
    method === 'PATCH'
      ? JSON.stringify({ athleteNote: 'ok' })
      : method === 'POST'
        ? (() => {
            const form = new FormData()
            form.append('file', new File(['x'], 'trace.gpx'))
            return form
          })()
        : undefined
  const request = new NextRequest(`http://localhost:3000/api/activities/${encodeURIComponent(id)}`, { method, body })
  // Next décode le segment dynamique avant de le passer au handler :
  // /api/activities/..%2Fusers%2Fme arrive ici sous la forme "../users/me".
  return handler(request, { params: Promise.resolve({ id }) })
}

const handlers: Array<[string, Handler, string]> = [
  ['GET /api/activities/:id', activityRoute.GET, 'GET'],
  ['PATCH /api/activities/:id', activityRoute.PATCH, 'PATCH'],
  ['GET /api/activities/:id/track', trackRoute.GET, 'GET'],
  ['GET /api/activities/:id/route', routeRoute.GET, 'GET'],
  ['GET /api/activities/:id/analysis', analysisRoute.GET, 'GET'],
  ['POST /api/activities/:id/gpx', gpxRoute.POST, 'POST'],
  ['POST /api/activities/:id/fit', fitRoute.POST, 'POST'],
]

describe('Route Handlers /api/activities/:id', () => {
  beforeEach(() => cookieJar.reset({ [SESSION_COOKIE_NAME]: token }))

  it('relaie l’activité de l’athlète connecté avec son jeton', async () => {
    let authorization: string | null = null
    backend.use(
      http.get(`${API_URL}/activities/:id`, ({ request, params }) => {
        authorization = request.headers.get('authorization')
        return HttpResponse.json({ id: params.id, laps: [] })
      }),
    )

    const res = await call(activityRoute.GET, 'GET', 'cmf1a2b3c4d5e6f7g8h9i0j1k')

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: 'cmf1a2b3c4d5e6f7g8h9i0j1k' })
    expect(authorization).toBe(`Bearer ${token}`)
  })

  it('T14 — relaie le 404 du backend pour l’activité d’un autre athlète', async () => {
    backend.use(
      http.get(`${API_URL}/activities/:id`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Activité introuvable' }, { status: 404 }),
      ),
    )

    const res = await call(activityRoute.GET, 'GET', 'cmfOtherAthleteActivity01')

    expect(res.status).toBe(404)
  })

  // T15 — traversée de chemin. Sans contrôle, fetch normalise
  // "/activities/../users/me" en "/users/me" : la route servirait de relais
  // authentifié vers n'importe quel endpoint du backend.
  describe('T15 — identifiant invalide → 400, backend jamais appelé', () => {
    const reachedBackend: string[] = []

    beforeEach(() => {
      reachedBackend.length = 0
      // Capte tout appel au backend pour rendre la traversée visible si elle a lieu.
      backend.use(
        http.all(`${API_URL}/*`, ({ request }) => {
          reachedBackend.push(`${request.method} ${new URL(request.url).pathname}`)
          return HttpResponse.json({ id: 'u1', email: 'athlete@test.dev' })
        }),
      )
    })

    it.each(handlers)('%s', async (_label, handler, method) => {
      const res = await call(handler, method, '../users/me')
      expect(reachedBackend).toEqual([])
      expect(res.status).toBe(400)
    })

    it.each(['..', 'abc/../../users/me', 'abc?include=all', 'abc#x', 'a b', ''])('GET avec id %j', async (id) => {
      const res = await call(activityRoute.GET, 'GET', id)
      expect(reachedBackend).toEqual([])
      expect(res.status).toBe(400)
    })
  })
})
