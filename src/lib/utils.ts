import { intlLocale, type Locale } from './i18n/config'

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

// Formateurs mis en cache : la grille du calendrier en appelle plusieurs
// centaines par rendu, et construire un Intl.NumberFormat coûte bien plus que
// de s'en servir.
const decimalFormats = new Map<string, Intl.NumberFormat>()

// Nombre à décimales fixes, avec le séparateur de la langue ("8.4" en anglais,
// "8,4" en français). Sans séparateur de milliers : une métrique se lit en
// colonne, comme toFixed() qu'elle remplace.
export function formatDecimal(value: number, fractionDigits: number, locale: Locale, { signed = false } = {}): string {
  const key = `${locale}|${fractionDigits}|${signed}`
  let format = decimalFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(intlLocale(locale), {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: false,
      // « +3.2 » : un écart (fraîcheur, progression) se lit avec son signe.
      signDisplay: signed ? 'exceptZero' : 'auto',
    })
    decimalFormats.set(key, format)
  }
  return format.format(value)
}

// Convertit des mètres en "8.4 km" (anglais) ou "8,4 km" (français)
export function formatDistance(meters: number, locale: Locale): string {
  return `${formatDecimal(meters / 1000, 1, locale)} km`
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

// Les dates suivent la langue de l'interface (voir lib/i18n), jamais la locale
// du navigateur : sinon un visiteur francophone lirait des dates en français
// au milieu de textes en anglais, et le rendu serveur différerait de celui du
// client.

// Majuscule initiale : le français écrit mois et jours en minuscules
// (« août 2026 »), ce qui détonne en tête d'un titre ou d'une étiquette.
export function capitalizeFirst(text: string, locale: Locale): string {
  return text.charAt(0).toLocaleUpperCase(intlLocale(locale)) + text.slice(1)
}

// Convertit un ISO datetime en "Tue, Aug 4" / "Mar. 4 août"
export function formatDateLabel(iso: string, locale: Locale): string {
  const label = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(iso),
  )
  return capitalizeFirst(label, locale)
}

// Convertit un ISO datetime en "Aug 2026" / "août 2026" (ancienneté d'un coach).
export function formatMonthYear(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', year: 'numeric' }).format(new Date(iso))
}

// Convertit une date "2026-11-07" en "November 7, 2026" / "7 novembre 2026".
// Lue en UTC : sans heure, la chaîne désigne minuit UTC, qui tombe la veille à
// l'ouest de Greenwich.
export function formatLegalDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(isoDate))
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
