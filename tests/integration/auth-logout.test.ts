import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/auth/logout/route'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { API_URL, backend, validToken } from './support/backend'
import { cookieJar } from './support/cookies'

describe('POST /api/auth/logout', () => {
  afterEach(() => vi.unstubAllEnvs())

  function backendLogout(status: number) {
    const authorizations: Array<string | null> = []
    backend.use(
      http.post(`${API_URL}/auth/logout`, ({ request }) => {
        authorizations.push(request.headers.get('Authorization'))
        return new HttpResponse(null, { status })
      }),
    )
    return authorizations
  }

  it('T26 — fait révoquer le jeton par l’API, puis efface le cookie de session', async () => {
    const token = validToken()
    cookieJar.reset({ [SESSION_COOKIE_NAME]: token })
    const authorizations = backendLogout(204)

    const res = await POST()

    expect(authorizations).toEqual([`Bearer ${token}`])
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, revoked: true })
    expect(cookieJar.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it('jeton déjà révoqué ou expiré (401) : rien à révoquer, cookie effacé', async () => {
    cookieJar.reset({ [SESSION_COOKIE_NAME]: validToken() })
    backendLogout(401)

    const res = await POST()

    expect(await res.json()).toEqual({ ok: true, revoked: true })
    expect(cookieJar.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it('API injoignable : l’utilisateur est quand même déconnecté de ce navigateur', async () => {
    cookieJar.reset({ [SESSION_COOKIE_NAME]: validToken() })
    backend.use(http.post(`${API_URL}/auth/logout`, () => HttpResponse.error()))

    const res = await POST()

    expect(await res.json()).toEqual({ ok: true, revoked: false })
    expect(cookieJar.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it('sans cookie : aucun appel à l’API', async () => {
    // Aucune route déclarée : un appel ferait échouer le test.
    const res = await POST()
    expect(await res.json()).toEqual({ ok: true, revoked: false })
  })

  // Un navigateur ne supprime un cookie que si la suppression reprend le
  // domaine qui l'a posé.
  it('reprend le domaine COOKIE_DOMAIN utilisé à la connexion', async () => {
    vi.stubEnv('COOKIE_DOMAIN', '.sessionized.app')
    cookieJar.reset({ [SESSION_COOKIE_NAME]: validToken() })
    backendLogout(204)

    await POST()

    expect(cookieJar.deletions()).toEqual([
      { name: SESSION_COOKIE_NAME, options: { path: '/', domain: '.sessionized.app' } },
    ])
  })
})
