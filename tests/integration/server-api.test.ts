import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { serverApiFetchStatus } from '@/lib/server-api'
import { REQUEST_PATH_HEADER } from '@/lib/session'
import { API_URL, backend, validToken } from './support/backend'
import { cookieJar } from './support/cookies'
import { resetRequestHeaders } from './support/request-headers'

// redirect() lève une erreur interceptée par Next ; ici, une erreur qui porte
// l'URL visée, pour que le test l'inspecte.
const { RedirectedTo } = vi.hoisted(() => ({
  RedirectedTo: class RedirectedTo extends Error {
    url: string
    constructor(url: string) {
      super(`redirect ${url}`)
      this.url = url
    }
  },
}))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new RedirectedTo(url)
  },
}))

async function redirectTarget(call: Promise<unknown>): Promise<URL> {
  const outcome = await call.then(
    () => null,
    (err: unknown) => err,
  )
  expect(outcome).toBeInstanceOf(RedirectedTo)
  return new URL((outcome as InstanceType<typeof RedirectedTo>).url, 'http://localhost')
}

const token = validToken()

describe('serverApiFetchStatus — session', () => {
  beforeEach(() => {
    cookieJar.reset({ [SESSION_COOKIE_NAME]: token })
    resetRequestHeaders({ [REQUEST_PATH_HEADER]: '/dashboard?month=2026-10' })
  })

  it('T20 — jeton non expiré mais refusé par l’API (401) : /login, retour sur la page, session expirée', async () => {
    backend.use(
      http.get(`${API_URL}/workouts`, () => HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 })),
    )

    const target = await redirectTarget(serverApiFetchStatus('/workouts'))
    expect(target.pathname).toBe('/login')
    expect(target.searchParams.get('redirect')).toBe('/dashboard?month=2026-10')
    expect(target.searchParams.get('reason')).toBe('expired')
  })

  it('sans cookie : /login sans parler d’expiration, et aucun appel à l’API', async () => {
    cookieJar.reset()

    const target = await redirectTarget(serverApiFetchStatus('/workouts'))
    expect(target.pathname).toBe('/login')
    expect(target.searchParams.get('reason')).toBeNull()
  })

  it('sans l’en-tête du proxy : retour par défaut sur /dashboard', async () => {
    resetRequestHeaders()
    backend.use(http.get(`${API_URL}/workouts`, () => new HttpResponse(null, { status: 401 })))

    const target = await redirectTarget(serverApiFetchStatus('/workouts'))
    expect(target.searchParams.get('redirect')).toBe('/dashboard')
  })

  it('transmet le jeton en Bearer et renvoie les données (200)', async () => {
    let authorization: string | null = null
    backend.use(
      http.get(`${API_URL}/workouts`, ({ request }) => {
        authorization = request.headers.get('authorization')
        return HttpResponse.json([{ id: 'wk-1' }])
      }),
    )

    expect(await serverApiFetchStatus('/workouts')).toEqual({ status: 200, data: [{ id: 'wk-1' }] })
    expect(authorization).toBe(`Bearer ${token}`)
  })

  it.each([403, 404, 500])('renvoie le statut %i à la page, sans rediriger', async (status) => {
    backend.use(http.get(`${API_URL}/workouts`, () => new HttpResponse(null, { status })))

    expect(await serverApiFetchStatus('/workouts')).toEqual({ status, data: null })
  })

  it('API injoignable : statut 0, sans rediriger', async () => {
    backend.use(http.get(`${API_URL}/workouts`, () => HttpResponse.error()))

    expect(await serverApiFetchStatus('/workouts')).toEqual({ status: 0, data: null })
  })
})
