import { afterEach, describe, expect, it, vi } from 'vitest'
import { backendUrl } from './env'

describe('backendUrl', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('préfixe le chemin par API_URL, lue à l’appel', () => {
    vi.stubEnv('API_URL', 'http://api:3000')
    expect(backendUrl('/activities')).toBe('http://api:3000/activities')
  })

  it('tolère une barre oblique finale dans API_URL', () => {
    vi.stubEnv('API_URL', 'https://api.sessionized.app/')
    expect(backendUrl('/users/me')).toBe('https://api.sessionized.app/users/me')
  })

  it('échoue avec un message explicite si API_URL manque', () => {
    vi.stubEnv('API_URL', '')
    expect(() => backendUrl('/activities')).toThrow(/API_URL n'est pas définie/)
  })
})
