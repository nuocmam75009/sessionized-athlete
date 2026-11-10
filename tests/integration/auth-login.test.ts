import { http, HttpResponse } from 'msw'
import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { LOCALE_COOKIE_NAME } from '@/lib/i18n/config'
import { API_URL, backend, makeJwt, validToken } from './support/backend'
import { cookieJar } from './support/cookies'

const credentials = { email: 'athlete@test.dev', password: 'Passw0rd!' }
const user = { sub: 'u1', email: credentials.email, role: 'ATHLETE' }

function loginRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/login', () => {
  it('T01 — relaie les identifiants et pose le cookie de session HttpOnly', async () => {
    const token = validToken()
    let forwarded: unknown
    backend.use(
      http.post(`${API_URL}/auth/login`, async ({ request }) => {
        forwarded = await request.json()
        return HttpResponse.json({ accessToken: token, user })
      }),
    )

    const res = await POST(loginRequest(credentials))

    expect(res.status).toBe(200)
    expect(forwarded).toEqual(credentials)
    expect(cookieJar.get(SESSION_COOKIE_NAME)).toMatchObject({
      value: token,
      options: { httpOnly: true, sameSite: 'lax', path: '/' },
    })
    // Le jeton ne doit jamais atteindre le JavaScript du navigateur.
    const body = await res.json()
    expect(body).toEqual({ user })
    expect(JSON.stringify(body)).not.toContain(token)
  })

  it('T06 — le cookie expire en même temps que le JWT', async () => {
    const exp = Math.floor(Date.now() / 1000) + 1800
    const token = makeJwt({ ...user, exp })
    backend.use(http.post(`${API_URL}/auth/login`, () => HttpResponse.json({ accessToken: token, user })))

    await POST(loginRequest(credentials))

    expect(cookieJar.get(SESSION_COOKIE_NAME)?.options.expires).toEqual(new Date(exp * 1000))
  })

  it('JWT sans exp : cookie de session (effacé à la fermeture du navigateur)', async () => {
    backend.use(http.post(`${API_URL}/auth/login`, () => HttpResponse.json({ accessToken: makeJwt(user), user })))

    await POST(loginRequest(credentials))

    expect(cookieJar.get(SESSION_COOKIE_NAME)?.options.expires).toBeUndefined()
  })

  it('T01 — cookie Secure en production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    backend.use(http.post(`${API_URL}/auth/login`, () => HttpResponse.json({ accessToken: validToken(), user })))

    await POST(loginRequest(credentials))

    expect(cookieJar.get(SESSION_COOKIE_NAME)?.options).toMatchObject({ secure: true })
    vi.unstubAllEnvs()
  })

  it('T02 — mot de passe erroné : message générique, aucun cookie', async () => {
    backend.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json({ statusCode: 401, message: 'Identifiants invalides' }, { status: 401 }),
      ),
    )

    const res = await POST(loginRequest({ ...credentials, password: 'mauvais' }))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ message: 'Invalid credentials' })
    expect(cookieJar.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it('T28 — compte verrouillé (429) : délai restant, sans révéler si le compte existe', async () => {
    backend.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json(
          {
            statusCode: 429,
            message: 'Trop de tentatives de connexion. Réessayez dans 14 min.',
            retryAfterSec: 812,
          },
          { status: 429 },
        ),
      ),
    )

    const res = await POST(loginRequest(credentials))

    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ message: 'Too many attempts. Try again in 14 min.' })
    expect(cookieJar.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  describe('T34 — message dans la langue de l’athlète', () => {
    function rejectCredentials() {
      backend.use(
        http.post(`${API_URL}/auth/login`, () =>
          HttpResponse.json({ statusCode: 401, message: 'Identifiants invalides' }, { status: 401 }),
        ),
      )
    }

    it('langue choisie (cookie), même si le navigateur en préfère une autre', async () => {
      rejectCredentials()
      const res = await POST(
        loginRequest(credentials, { cookie: `${LOCALE_COOKIE_NAME}=fr`, 'accept-language': 'en-US,en;q=0.9' }),
      )
      expect(await res.json()).toEqual({ message: 'Identifiants invalides' })
    })

    it('à défaut, langue du navigateur', async () => {
      rejectCredentials()
      const res = await POST(loginRequest(credentials, { 'accept-language': 'fr-FR,fr;q=0.9' }))
      expect(await res.json()).toEqual({ message: 'Identifiants invalides' })
    })

    it('délai de verrouillage rédigé en français', async () => {
      backend.use(
        http.post(`${API_URL}/auth/login`, () =>
          HttpResponse.json({ statusCode: 429, message: 'Trop de tentatives.', retryAfterSec: 812 }, { status: 429 }),
        ),
      )
      const res = await POST(loginRequest(credentials, { cookie: `${LOCALE_COOKIE_NAME}=fr` }))
      expect(await res.json()).toEqual({ message: 'Trop de tentatives. Réessayez dans 14 min.' })
    })
  })
})
