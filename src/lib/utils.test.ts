import { describe, expect, it } from 'vitest'
import { formatDistance, formatDuration, formatPace, isSameCalendarDay, isValidId, paceColor, tsbColor } from './utils'

describe('formatPace', () => {
  it('formate des secondes/km en minutes et secondes', () => {
    expect(formatPace(245)).toBe(`4'05"/km`)
  })

  it('arrondit les valeurs décimales venues du backend', () => {
    expect(formatPace(244.6)).toBe(`4'05"/km`)
    expect(formatPace(244.4)).toBe(`4'04"/km`)
  })

  // Valeur limite : 299,5 s s'arrondit à 300 s, la minute doit basculer
  // plutôt que d'afficher 4'60".
  it('bascule à la minute suivante quand l’arrondi atteint 60 s', () => {
    expect(formatPace(299.5)).toBe(`5'00"/km`)
  })
})

describe('formatDuration', () => {
  it.each([
    [0, `0'00"`],
    [59, `0'59"`],
    [3154, `52'34"`],
    [3599, `59'59"`],
    [3600, `1h00'`],
    [5400, `1h30'`],
  ])('%i s → %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })
})

describe('formatDistance', () => {
  it('convertit les mètres en kilomètres à une décimale', () => {
    expect(formatDistance(8400)).toBe('8.4 km')
    expect(formatDistance(0)).toBe('0.0 km')
  })
})

// Valeurs limites des seuils de couleur : chaque borne appartient à la classe
// la moins sévère (comparaisons strictes).
describe('paceColor', () => {
  it.each([
    [-11, 'text-danger'],
    [-10, 'text-warning'],
    [-6, 'text-warning'],
    [-5, 'text-success'],
    [0, 'text-success'],
  ])('delta %i → %s', (delta, expected) => {
    expect(paceColor(delta)).toBe(expected)
  })
})

describe('tsbColor', () => {
  it.each([
    [-21, 'text-danger'],
    [-20, 'text-warning'],
    [-1, 'text-warning'],
    [0, 'text-success'],
    [15, 'text-success'],
  ])('TSB %i → %s', (tsb, expected) => {
    expect(tsbColor(tsb)).toBe(expected)
  })
})

describe('isValidId', () => {
  it('accepte un cuid Prisma', () => {
    expect(isValidId('cmf1a2b3c4d5e6f7g8h9i0j1k')).toBe(true)
  })

  // T15 — tout ce qui modifierait l'URL du backend une fois concaténé.
  it.each(['', '..', '../users/me', 'a/b', 'abc?x=1', 'abc#x', 'a b', 'a%2Fb', 'a'.repeat(65)])('T15 — refuse %j', (id) => {
    expect(isValidId(id)).toBe(false)
  })
})

describe('isSameCalendarDay', () => {
  it('ignore l’heure', () => {
    expect(isSameCalendarDay(new Date(2026, 7, 4, 0, 0), new Date(2026, 7, 4, 23, 59))).toBe(true)
  })

  it('distingue deux jours consécutifs, y compris à minuit', () => {
    expect(isSameCalendarDay(new Date(2026, 7, 4, 23, 59), new Date(2026, 7, 5, 0, 0))).toBe(false)
  })
})
