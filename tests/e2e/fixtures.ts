import { test as base, type BrowserContext } from '@playwright/test'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { formatDayLabel, formatMonthLabel, getMonthStart, toDateParam } from '@/lib/calendar'
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, type Locale } from '@/lib/i18n/config'
import { makeToken, USERS } from './mock-api/server'

type MockUser = (typeof USERS)[keyof typeof USERS]

// Tout test système bloque les requêtes hors de localhost (tuiles de carte,
// polices…) : un test ne doit dépendre ni du réseau ni d'un service tiers.
export const test = base.extend<{ blockExternalRequests: void }>({
  blockExternalRequests: [
    async ({ context }, use) => {
      await context.route(
        (url) => url.hostname !== 'localhost',
        (route) => route.abort('blockedbyclient'),
      )
      await use()
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'

// Ouvre une session sans passer par le formulaire : seuls les tests de
// connexion (auth.spec.ts) exercent l'écran de login.
export async function signInAs(context: BrowserContext, user: MockUser, expiresInSec?: number) {
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: makeToken(user, expiresInSec),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}

// Choisit la langue de l'interface comme le bouton de langue (même cookie).
// Sans elle, l'app suit l'Accept-Language du navigateur de test (en-US).
export async function chooseLocale(context: BrowserContext, locale: Locale) {
  await context.addCookies([{ name: LOCALE_COOKIE_NAME, value: locale, domain: 'localhost', path: '/', sameSite: 'Lax' }])
}

// Libellés calculés par les fonctions de l'app, pour le jour où tourne le test.
export function currentMonthLabel(locale: Locale = DEFAULT_LOCALE): string {
  return formatMonthLabel(getMonthStart(new Date()), locale)
}

export function todayLabel(locale: Locale = DEFAULT_LOCALE): string {
  return formatDayLabel(toDateParam(new Date()), locale)
}
