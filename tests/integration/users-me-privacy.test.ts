import { http, HttpResponse } from 'msw'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { GET as exportData } from '@/app/api/users/me/export/route'
import { POST as recordConsent } from '@/app/api/users/me/health-consent/route'
import { DELETE as deleteAccount } from '@/app/api/users/me/route'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { API_URL, backend, validToken } from './support/backend'
import { cookieJar } from './support/cookies'

// T24 / T25 — Route Handlers des droits RGPD : consentement, export, effacement.

const token = validToken()

function jsonRequest(path: string, method: string, body: unknown) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('DELETE /api/users/me', () => {
  beforeEach(() => cookieJar.reset({ [SESSION_COOKIE_NAME]: token }))

  it('T25 — relaie le seul mot de passe avec le jeton, puis efface le cookie de session', async () => {
    let forwarded: unknown
    let authorization: string | null = null
    backend.use(
      http.delete(`${API_URL}/users/me`, async ({ request }) => {
        forwarded = await request.json()
        authorization = request.headers.get('authorization')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const res = await deleteAccount(
      jsonRequest('/api/users/me', 'DELETE', { password: 'Passw0rd!', role: 'COACH', userId: 'autre' }),
    )

    expect(res.status).toBe(204)
    expect(forwarded).toEqual({ password: 'Passw0rd!' })
    expect(authorization).toBe(`Bearer ${token}`)
    expect(cookieJar.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it('T25 — mot de passe refusé (403) : statut relayé, message de l’API retenu, session conservée', async () => {
    backend.use(
      http.delete(`${API_URL}/users/me`, () =>
        HttpResponse.json({ statusCode: 403, message: 'Mot de passe incorrect' }, { status: 403 }),
      ),
    )

    const res = await deleteAccount(jsonRequest('/api/users/me', 'DELETE', { password: 'mauvais' }))

    expect(res.status).toBe(403)
    expect(JSON.stringify(await res.json())).not.toContain('Mot de passe incorrect')
    expect(cookieJar.get(SESSION_COOKIE_NAME)?.value).toBe(token)
  })

  it('API injoignable : 502, session conservée', async () => {
    backend.use(http.delete(`${API_URL}/users/me`, () => HttpResponse.error()))

    const res = await deleteAccount(jsonRequest('/api/users/me', 'DELETE', { password: 'Passw0rd!' }))

    expect(res.status).toBe(502)
    expect(cookieJar.get(SESSION_COOKIE_NAME)?.value).toBe(token)
  })

  it('sans cookie : 401, l’API n’est pas appelée', async () => {
    cookieJar.reset()

    const res = await deleteAccount(jsonRequest('/api/users/me', 'DELETE', { password: 'Passw0rd!' }))

    expect(res.status).toBe(401)
  })
})

describe('GET /api/users/me/export', () => {
  beforeEach(() => cookieJar.reset({ [SESSION_COOKIE_NAME]: token }))

  it('T25 — relaie le fichier en téléchargement, sans cache', async () => {
    const exported = { format: 'sessionized-export/2', account: { email: 'athlete@test.dev' }, activities: [] }
    backend.use(http.get(`${API_URL}/users/me/export`, () => HttpResponse.json(exported)))

    const res = await exportData()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-disposition')).toMatch(
      /^attachment; filename="sessionized-export-\d{4}-\d{2}-\d{2}\.json"$/,
    )
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual(exported)
  })

  it('refus de l’API : statut relayé, sans son message', async () => {
    backend.use(
      http.get(`${API_URL}/users/me/export`, () =>
        HttpResponse.json({ message: 'Profil athlète introuvable' }, { status: 403 }),
      ),
    )

    const res = await exportData()

    expect(res.status).toBe(403)
    expect(res.headers.get('content-disposition')).toBeNull()
    expect(JSON.stringify(await res.json())).not.toContain('introuvable')
  })
})

describe('POST /api/users/me/health-consent', () => {
  beforeEach(() => cookieJar.reset({ [SESSION_COOKIE_NAME]: token }))

  it('T24 — relaie la valeur cochée et renvoie la date enregistrée', async () => {
    let forwarded: unknown
    backend.use(
      http.post(`${API_URL}/users/me/health-consent`, async ({ request }) => {
        forwarded = await request.json()
        return HttpResponse.json({ healthDataConsentAt: '2026-11-08T09:00:00.000Z' })
      }),
    )

    const res = await recordConsent(
      jsonRequest('/api/users/me/health-consent', 'POST', { healthDataConsent: true, email: 'autre@test.dev' }),
    )

    expect(res.status).toBe(200)
    expect(forwarded).toEqual({ healthDataConsent: true })
    expect(await res.json()).toEqual({ healthDataConsentAt: '2026-11-08T09:00:00.000Z' })
  })

  it('valeur refusée par l’API (400) : statut relayé', async () => {
    backend.use(
      http.post(`${API_URL}/users/me/health-consent`, () =>
        HttpResponse.json({ message: 'doit valoir true' }, { status: 400 }),
      ),
    )

    const res = await recordConsent(jsonRequest('/api/users/me/health-consent', 'POST', { healthDataConsent: false }))

    expect(res.status).toBe(400)
  })
})
