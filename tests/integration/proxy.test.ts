import { getRedirectUrl, unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import nextConfig from '../../next.config'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { REQUEST_PATH_HEADER } from '@/lib/session'
import { config, proxy } from '@/proxy'
import { makeJwt, validToken } from './support/backend'

function requestTo(path: string, token?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: token ? { cookie: `${SESSION_COOKIE_NAME}=${token}` } : {},
  })
}

function redirectTarget(response: Response) {
  const location = getRedirectUrl(response as Parameters<typeof getRedirectUrl>[0])
  return location ? new URL(location) : null
}

describe('proxy — périmètre', () => {
  it.each(['/dashboard', '/activities/upload', '/activities/abc', '/profile', '/coaches', '/athlete-data'])(
    'protège %s',
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig, url })).toBe(true)
    },
  )

  // Les routes /api vérifient elles-mêmes le cookie (401 JSON plutôt qu'une
  // redirection HTML) ; /login doit rester accessible sans session.
  it.each(['/login', '/api/auth/login', '/api/activities/abc'])('laisse passer %s', (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig, url })).toBe(false)
  })
})

describe('proxy — contrôle de session', () => {
  it('T05 — /dashboard sans cookie → /login?redirect=/dashboard', () => {
    const target = redirectTarget(proxy(requestTo('/dashboard')))
    expect(target?.pathname).toBe('/login')
    expect(target?.searchParams.get('redirect')).toBe('/dashboard')
    // Jamais connecté : pas de message « session expirée ».
    expect(target?.searchParams.get('reason')).toBeNull()
  })

  it('garde la requête (?month=…) dans le chemin de retour', () => {
    const target = redirectTarget(proxy(requestTo('/dashboard?month=2026-10')))
    expect(target?.searchParams.get('redirect')).toBe('/dashboard?month=2026-10')
  })

  it('laisse passer un JWT valide', () => {
    const response = proxy(requestTo('/dashboard', validToken()))
    expect(redirectTarget(response)).toBeNull()
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  // Les pages le lisent pour revenir au bon endroit après un 401 de l'API
  // (voir server-api.test.ts).
  it('transmet aux pages le chemin demandé, et écrase celui qu’enverrait le navigateur', () => {
    const request = new NextRequest('http://localhost:3000/dashboard?month=2026-10', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${validToken()}`, [REQUEST_PATH_HEADER]: '//evil.example' },
    })
    const response = proxy(request)
    expect(response.headers.get(`x-middleware-request-${REQUEST_PATH_HEADER}`)).toBe('/dashboard?month=2026-10')
  })

  it('T06 — cookie présent mais JWT expiré → /login, cookie effacé', () => {
    const expired = makeJwt({ sub: 'u1', role: 'ATHLETE', exp: Math.floor(Date.now() / 1000) - 60 })
    const response = proxy(requestTo('/dashboard', expired))

    const target = redirectTarget(response)
    expect(target?.pathname).toBe('/login')
    expect(target?.searchParams.get('redirect')).toBe('/dashboard')
    expect(target?.searchParams.get('reason')).toBe('expired')
    expect(response.headers.get('set-cookie')).toMatch(new RegExp(`${SESSION_COOKIE_NAME}=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)`, 'i'))
  })

  it.each(['pas-un-jwt', 'a.b.c', `header.${Buffer.from('{"exp":"demain"').toString('base64url')}.sig`])(
    'T06 — jeton illisible %j → /login',
    (token) => {
      expect(redirectTarget(proxy(requestTo('/dashboard', token)))?.pathname).toBe('/login')
    },
  )
})
