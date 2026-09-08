// Le sport d'une activité arrive sous deux conventions selon la source :
// Strava renvoie son `sport_type` en PascalCase ("TrailRun", "MountainBikeRide"),
// le .fit renvoie le sport décodé par la montre en snake_case ("running",
// "cycling"). On normalise les deux vers un même jeu de catégories — sans quoi
// un "Run" Strava et un "running" .fit compteraient comme deux sports distincts
// dans le récapitulatif de semaine.
export type SportKind = 'run' | 'trail_run' | 'ride' | 'swim' | 'walk' | 'hike' | 'strength' | 'row' | 'ski' | 'other'

const SPORT_KIND_LABELS: Record<SportKind, string> = {
  run: 'Run',
  trail_run: 'Trail run',
  ride: 'Ride',
  swim: 'Swim',
  walk: 'Walk',
  hike: 'Hike',
  strength: 'Strength',
  row: 'Rowing',
  ski: 'Ski',
  other: 'Other',
}

export function toSportKind(sport: string | null): SportKind {
  if (!sport) return 'other'
  // "TrailRun" et "trail_running" se ramènent tous deux à "trailrunning".
  const value = sport.toLowerCase().replace(/[^a-z]/g, '')

  if (value.includes('trail') && value.includes('run')) return 'trail_run'
  if (value.includes('run')) return 'run'
  if (value.includes('swim')) return 'swim'
  if (value.includes('ride') || value.includes('cycl') || value.includes('bik')) return 'ride'
  if (value.includes('ski') || value.includes('snowboard')) return 'ski'
  if (value.includes('hik') || value.includes('snowshoe') || value.includes('mountaineering')) return 'hike'
  if (value.includes('walk')) return 'walk'
  if (value.includes('row') || value.includes('kayak') || value.includes('canoe') || value.includes('paddl')) return 'row'
  if (
    value.includes('weight') ||
    value.includes('strength') ||
    value.includes('crossfit') ||
    value.includes('training') ||
    value.includes('workout') ||
    value.includes('yoga') ||
    value.includes('pilates') ||
    value.includes('ellipt') ||
    value.includes('fitnessequipment')
  ) {
    return 'strength'
  }
  return 'other'
}

export function sportKindLabel(kind: SportKind): string {
  return SPORT_KIND_LABELS[kind]
}

// Couleurs définies dans globals.css. La teinte suit le sport, jamais son rang
// dans un classement : une semaine sans vélo ne doit pas repeindre les autres
// barres. Seuls les cinq sports les plus courants ont leur teinte propre (voir
// le commentaire des tokens), les autres partagent le neutre.
const SPORT_COLOR_VARS: Record<SportKind, string> = {
  run: 'var(--color-sport-run)',
  trail_run: 'var(--color-sport-trail)',
  ride: 'var(--color-sport-ride)',
  swim: 'var(--color-sport-swim)',
  strength: 'var(--color-sport-strength)',
  walk: 'var(--color-sport-other)',
  hike: 'var(--color-sport-other)',
  row: 'var(--color-sport-other)',
  ski: 'var(--color-sport-other)',
  other: 'var(--color-sport-other)',
}

export function sportColor(kind: SportKind): string {
  return SPORT_COLOR_VARS[kind]
}

// Une allure en min/km n'a de sens qu'à pied — sur un vélo ou en natation elle
// induit en erreur, on ne l'affiche pas.
export function isFootSport(kind: SportKind): boolean {
  return kind === 'run' || kind === 'trail_run' || kind === 'walk' || kind === 'hike'
}
