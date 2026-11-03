import { test as base, type BrowserContext } from '@playwright/test'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
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

// Libellés calculés comme le fait l'app (en-US), pour le jour où tourne le test.
export function currentMonthLabel(): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())
}

export function todayLabel(): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())
}
