import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/auth/logout/route'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { validToken } from './support/backend'
import { cookieJar } from './support/cookies'

describe('POST /api/auth/logout', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('efface le cookie de session', async () => {
    cookieJar.reset({ [SESSION_COOKIE_NAME]: validToken() })

    const res = await POST()

    expect(res.status).toBe(200)
    expect(cookieJar.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  // Un navigateur ne supprime un cookie que si la suppression reprend le
  // domaine qui l'a posé.
  it('reprend le domaine COOKIE_DOMAIN utilisé à la connexion', async () => {
    vi.stubEnv('COOKIE_DOMAIN', '.sessionized.app')
    cookieJar.reset({ [SESSION_COOKIE_NAME]: validToken() })

    await POST()

    expect(cookieJar.deletions()).toEqual([
      { name: SESSION_COOKIE_NAME, options: { path: '/', domain: '.sessionized.app' } },
    ])
  })
})
