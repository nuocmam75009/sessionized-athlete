import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE_NAME, resolveLocale, type Locale } from './config'
import { getDictionary, type Dictionary } from './dictionaries'

// Langue de la requête en cours, pour les Server Components et les
// generateMetadata. next/headers rend ce module inutilisable dans un composant
// client (erreur au build) : ceux-ci passent par useI18n().
//
// cache() : le layout, la page et generateMetadata la demandent pour une même
// requête, une seule lecture suffit.
export const getLocale = cache(async (): Promise<Locale> => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()])
  return resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value, headerList.get('accept-language'))
})

export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale()
  return { locale, t: getDictionary(locale) }
}
