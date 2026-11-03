import { describe, expect, it } from 'vitest'
import { loginPath } from './session'

describe('loginPath', () => {
  it('encode le chemin de retour, requête comprise', () => {
    const url = new URL(loginPath('/dashboard?month=2026-10'), 'http://localhost')
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('redirect')).toBe('/dashboard?month=2026-10')
    expect(url.searchParams.has('reason')).toBe(false)
  })

  it('signale une session expirée', () => {
    expect(loginPath('/profile', { expired: true })).toBe('/login?redirect=%2Fprofile&reason=expired')
  })
})
