import { describe, expect, it } from 'vitest'
import { isJwtExpired, jwtExpiresAt } from './jwt'

const NOW = Date.UTC(2026, 10, 3, 12, 0, 0)

function jwt(payload: unknown): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`
}

describe('isJwtExpired', () => {
  // Valeurs limites autour de exp (en secondes, comme dans le JWT).
  it.each([
    [NOW / 1000 - 1, true],
    [NOW / 1000, true],
    [NOW / 1000 + 1, false],
  ])('exp = %i → expiré : %s', (exp, expected) => {
    expect(isJwtExpired(jwt({ sub: 'u1', exp }), NOW)).toBe(expected)
  })

  it('laisse le backend trancher quand exp est absent', () => {
    expect(isJwtExpired(jwt({ sub: 'u1' }), NOW)).toBe(false)
  })

  it('décode le base64url (caractères - et _)', () => {
    // Ce sub produit des "-" et "_" une fois encodé.
    const token = jwt({ sub: '>>>???', email: 'é@test.dev', exp: NOW / 1000 + 60 })
    expect(token.split('.')[1]).toMatch(/[-_]/)
    expect(isJwtExpired(token, NOW)).toBe(false)
  })

  it.each([
    ['vide', ''],
    ['sans point', 'pas-un-jwt'],
    ['deux segments', 'a.b'],
    ['payload non base64', 'a.!!!.c'],
    ['payload non JSON', `a.${Buffer.from('pas du json').toString('base64url')}.c`],
    ['payload null', `a.${Buffer.from('null').toString('base64url')}.c`],
    ['exp non numérique', jwt({ exp: 'demain' })],
  ])('jeton illisible (%s) → expiré', (_label, token) => {
    expect(isJwtExpired(token, NOW)).toBe(true)
  })
})

describe('jwtExpiresAt', () => {
  it('convertit exp (secondes) en date', () => {
    expect(jwtExpiresAt(jwt({ sub: 'u1', exp: NOW / 1000 + 60 }))).toEqual(new Date(NOW + 60_000))
  })

  it.each([
    ['sans exp', jwt({ sub: 'u1' })],
    ['exp non numérique', jwt({ exp: 'demain' })],
    ['illisible', 'pas-un-jwt'],
  ])('%s → null', (_label, token) => {
    expect(jwtExpiresAt(token)).toBeNull()
  })
})
