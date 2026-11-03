// Convertit des secondes/km en "4'05"/km" — arrondi car les valeurs venant
// directement du backend (ex: Lap.avgPaceSecPerKm) sont des Float, pas des
// entiers déjà arrondis comme le fait activity-format.ts avant d'appeler ceci.
export function formatPace(secPerKm: number): string {
  const rounded = Math.round(secPerKm)
  const min = Math.floor(rounded / 60)
  const sec = rounded % 60
  return `${min}'${String(sec).padStart(2, '0')}"/km`
}

// Convertit des secondes en "52'34""
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}'`
  return `${m}'${String(s).padStart(2, '0')}"`
}

// Convertit des mètres en "8,4 km"
export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`
}

// Couleur du delta allure
export function paceColor(delta: number): string {
  if (delta < -10) return 'text-danger'
  if (delta < -5) return 'text-warning'
  return 'text-success'
}

// Couleur du TSB
export function tsbColor(tsb: number): string {
  if (tsb < -20) return 'text-danger'
  if (tsb < 0) return 'text-warning'
  return 'text-success'
}

// Langue unique de l'interface, reprise par <html lang>. Toutes les dates
// passent par elle plutôt que par la locale du navigateur : sinon un visiteur
// francophone lirait des dates en français au milieu de textes en anglais, et
// le rendu serveur différerait de celui du client.
export const APP_LOCALE = 'en-US'

// Convertit un ISO datetime en "Tue, Aug 4"
export function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat(APP_LOCALE, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso))
}

// Identifiant transmis tel quel dans une URL du backend (cuid Prisma : lettres
// et chiffres). Tout autre caractère est refusé : une fois concaténé, un
// segment "../users/me" — que Next décode depuis "..%2Fusers%2Fme" — ferait
// sortir la requête de /activities vers n'importe quel endpoint, avec le jeton
// de l'athlète.
export function isValidId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id)
}

// Deux dates tombent le même jour calendaire (comparaison locale)
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
