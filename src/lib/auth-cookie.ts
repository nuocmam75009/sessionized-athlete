import type { cookies } from 'next/headers'

type CookieStore = Awaited<ReturnType<typeof cookies>>

// Nom propre à cette app : un cookie host-only n'est PAS isolé par port (seul
// le domaine compte pour le scoping), donc athlete (localhost:3000) et coach
// (localhost:3001) partageaient le même cookie "sessionized_token" en dev —
// se connecter sur l'un écrasait la session lue par l'autre. Chaque app a
// maintenant son propre nom de cookie, y compris si COOKIE_DOMAIN est un jour
// positionné sur un domaine parent commun en production.
export const SESSION_COOKIE_NAME = 'sessionized_athlete_token'

export function setSessionCookie(cookieStore: CookieStore, token: string) {
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
  })
}
