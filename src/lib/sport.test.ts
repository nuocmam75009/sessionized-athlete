import { describe, expect, it } from 'vitest'
import { isFootSport, toSportKind } from './sport'

// Partitions d'équivalence : une valeur Strava (PascalCase) et une valeur .fit
// (snake_case) par catégorie, plus les cas sans sport.
describe('toSportKind', () => {
  it.each([
    ['Run', 'run'],
    ['running', 'run'],
    ['TrailRun', 'trail_run'],
    ['trail_running', 'trail_run'],
    ['Ride', 'ride'],
    ['cycling', 'ride'],
    ['MountainBikeRide', 'ride'],
    ['Swim', 'swim'],
    ['WeightTraining', 'strength'],
    ['fitness_equipment', 'strength'],
    ['Hike', 'hike'],
    ['Walk', 'walk'],
    ['Rowing', 'row'],
    ['AlpineSki', 'ski'],
    ['Golf', 'other'],
    [null, 'other'],
    ['', 'other'],
  ])('%j → %s', (sport, expected) => {
    expect(toSportKind(sport)).toBe(expected)
  })
})

describe('isFootSport', () => {
  it('n’affiche une allure que pour les sports à pied', () => {
    expect(isFootSport('run')).toBe(true)
    expect(isFootSport('hike')).toBe(true)
    expect(isFootSport('ride')).toBe(false)
    expect(isFootSport('swim')).toBe(false)
  })
})
