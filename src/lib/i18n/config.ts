// Langues de l'interface. Module sans dépendance serveur : il est lu aussi bien
// par le layout racine que par le bouton de langue et par les Route Handlers.

export const LOCALES = ['en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

// Langue d'un visiteur dont ni le cookie ni le navigateur ne désignent une
// langue disponible.
export const DEFAULT_LOCALE: Locale = 'en'

// Choix explicite de l'athlète, posé par le bouton de langue (lib/i18n/actions.ts).
// Lu par le serveur seulement : le navigateur reçoit la langue toute résolue.
export const LOCALE_COOKIE_NAME = 'sessionized_locale'

// Une année : le choix d'une langue ne se refait pas à chaque visite.
export const LOCALE_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365

// Balise complète passée à Intl (dates, nombres) et à <html lang>. La région
// fixe les conventions de format : 12 h et mois avant le jour en anglais
// américain, 24 h et jour avant le mois en français.
const INTL_LOCALES: Record<Locale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
}

// Nom de chaque langue écrit dans cette langue : c'est sous ce nom qu'un
// visiteur la reconnaît, quelle que soit la langue affichée.
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
}

export function intlLocale(locale: Locale): string {
  return INTL_LOCALES[locale]
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Première langue disponible de l'en-tête Accept-Language, dans l'ordre de
 * préférence du navigateur (« fr-CH, fr;q=0.9, en;q=0.8 » → fr). Seule la
 * langue compte, pas la région : un navigateur belge ou canadien a l'interface
 * en français. Null si aucune langue proposée n'est disponible.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null

  const ranges = acceptLanguage
    .split(',')
    .map((part, position) => {
      const [tag, ...params] = part.trim().split(';')
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const q = qParam ? Number(qParam.slice(2)) : 1
      return { language: tag.trim().split('-')[0].toLowerCase(), q: Number.isFinite(q) ? q : 0, position }
    })
    // q=0 signifie « surtout pas cette langue ».
    .filter((range) => range.language && range.q > 0)
    // À poids égal, l'ordre de l'en-tête départage.
    .sort((a, b) => b.q - a.q || a.position - b.position)

  return ranges.map((range) => range.language).find(isLocale) ?? null
}

// Ordre de décision : choix explicite (cookie) > langue du navigateur > défaut.
// Une valeur de cookie inconnue (ancienne langue retirée, cookie forgé) est
// ignorée plutôt que de faire échouer le rendu.
export function resolveLocale(cookieValue: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(cookieValue)) return cookieValue
  return negotiateLocale(acceptLanguage) ?? DEFAULT_LOCALE
}
