import { describe, expect, it } from 'vitest'
import { isLocale, negotiateLocale, resolveLocale } from './config'

// T34 — langue de l'interface.

describe('negotiateLocale', () => {
  it('retient la première langue disponible dans l’ordre de préférence du navigateur', () => {
    expect(negotiateLocale('fr-CH, fr;q=0.9, en;q=0.8, *;q=0.5')).toBe('fr')
    expect(negotiateLocale('de-DE, en-GB;q=0.7, fr;q=0.6')).toBe('en')
  })

  it('suit les poids q plutôt que l’ordre d’écriture', () => {
    expect(negotiateLocale('en;q=0.4, fr;q=0.9')).toBe('fr')
  })

  it('ignore la région et la casse', () => {
    expect(negotiateLocale('FR-be')).toBe('fr')
  })

  it('écarte une langue refusée (q=0)', () => {
    expect(negotiateLocale('fr;q=0, en;q=0.5')).toBe('en')
  })

  it('renvoie null sans langue disponible ou sans en-tête', () => {
    expect(negotiateLocale('de, es;q=0.8')).toBeNull()
    expect(negotiateLocale('')).toBeNull()
    expect(negotiateLocale(null)).toBeNull()
  })
})

describe('resolveLocale', () => {
  it('donne la priorité au choix explicite (cookie) sur le navigateur', () => {
    expect(resolveLocale('en', 'fr-FR,fr;q=0.9')).toBe('en')
    expect(resolveLocale('fr', 'en-US')).toBe('fr')
  })

  it('retombe sur le navigateur, puis sur l’anglais', () => {
    expect(resolveLocale(undefined, 'fr-FR')).toBe('fr')
    expect(resolveLocale(undefined, 'de-DE')).toBe('en')
    expect(resolveLocale(undefined, null)).toBe('en')
  })

  it('ignore une valeur de cookie inconnue ou forgée', () => {
    expect(resolveLocale('de', 'fr-FR')).toBe('fr')
    expect(resolveLocale('<script>', null)).toBe('en')
  })
})

describe('isLocale', () => {
  it('n’accepte que les langues de l’interface', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(true)
    expect(isLocale('fr-FR')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})
