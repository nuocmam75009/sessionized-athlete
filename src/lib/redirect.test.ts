import { describe, expect, it } from 'vitest'
import { safeRedirectTarget } from './redirect'

describe('safeRedirectTarget', () => {
  it.each(['/dashboard', '/activities/abc123', '/dashboard?month=2026-08'])('conserve le chemin interne %s', (path) => {
    expect(safeRedirectTarget(path)).toBe(path)
  })

  it('retombe sur /dashboard sans paramètre', () => {
    expect(safeRedirectTarget(null)).toBe('/dashboard')
    expect(safeRedirectTarget('')).toBe('/dashboard')
  })

  // T04 — redirection ouverte. Un navigateur lit "\" comme "/" dans une URL
  // http(s), et retire tabulations et retours à la ligne : chacune de ces
  // valeurs mène hors du site si elle est passée telle quelle à router.push().
  it.each([
    '//evil.example',
    '/\\evil.example',
    '/\\/evil.example',
    '/\t/evil.example',
    '/\n/evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    'dashboard',
  ])('T04 — refuse %j', (value) => {
    expect(safeRedirectTarget(value)).toBe('/dashboard')
  })
})
