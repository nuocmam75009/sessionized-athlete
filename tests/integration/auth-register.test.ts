import { http, HttpResponse } from 'msw'
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { POST } from '@/app/api/auth/register/route'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { API_URL, backend, validToken } from './support/backend'
import { cookieJar } from './support/cookies'

const payload = {
  email: 'camille@test.dev',
  password: 'motdepasse',
  role: 'ATHLETE',
  healthDataConsent: true,
}

function registerRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Messages réellement renvoyés par l'API (ValidationPipe + politique de mots
// de passe, src/auth/password-policy.ts).
const API_TOO_WEAK =
  "Mot de passe trop faible : il faut au moins 8 caractères mêlant 3 types parmi majuscules, minuscules, chiffres et caractères spéciaux, ou une phrase d'au moins 5 mots, ou au moins 16 chiffres."
const API_TOO_COMMON =
  'Mot de passe trop courant ou trop prévisible (mot courant suivi de chiffres, suite ou répétition de caractères) : choisissez-en un autre.'

describe('POST /api/auth/register', () => {
  it('T27 — mot de passe refusé : chaque raison, traduite, et aucun cookie', async () => {
    backend.use(
      http.post(`${API_URL}/auth/register`, () =>
        HttpResponse.json(
          { statusCode: 400, error: 'Bad Request', message: [`${API_TOO_WEAK} ${API_TOO_COMMON}`] },
          { status: 400 },
        ),
      ),
    )

    const res = await POST(registerRequest(payload))

    expect(res.status).toBe(400)
    const body = (await res.json()) as { message: string; reasons: string[] }
    expect(body.message).toBe('Choose another password.')
    expect(body.reasons).toEqual([
      expect.stringMatching(/^Too weak/),
      expect.stringMatching(/^Too common or predictable/),
    ])
    // Le navigateur ne reçoit que des messages de l'app, pas ceux de l'API.
    expect(JSON.stringify(body)).not.toContain('Mot de passe')
    expect(cookieJar.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it('email déjà utilisé (409) : message générique, qui ne confirme pas l’existence du compte', async () => {
    backend.use(
      http.post(`${API_URL}/auth/register`, () =>
        HttpResponse.json({ statusCode: 409, message: 'Un compte existe déjà avec cet email' }, { status: 409 }),
      ),
    )

    const res = await POST(registerRequest(payload))

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ message: 'Registration failed' })
  })

  it('trop de requêtes (429) : délai tiré de l’en-tête Retry-After', async () => {
    backend.use(
      http.post(`${API_URL}/auth/register`, () =>
        HttpResponse.json({ message: 'Trop de requêtes' }, { status: 429, headers: { 'Retry-After': '45' } }),
      ),
    )

    const res = await POST(registerRequest(payload))

    expect(await res.json()).toEqual({ message: 'Too many attempts. Try again in 1 min.' })
  })

  it('inscription acceptée : cookie de session posé', async () => {
    const token = validToken()
    backend.use(
      http.post(`${API_URL}/auth/register`, () =>
        HttpResponse.json({ accessToken: token, user: { sub: 'u1', email: payload.email, role: 'ATHLETE' } }),
      ),
    )

    const res = await POST(registerRequest(payload))

    expect(res.status).toBe(200)
    expect(cookieJar.get(SESSION_COOKIE_NAME)?.value).toBe(token)
  })
})
