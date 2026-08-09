import type { cookies } from 'next/headers'

type CookieStore = Awaited<ReturnType<typeof cookies>>

// Domaine partagé (ex: ".sessionized.app") pour que le cookie de session
// reste lisible par athlete.sessionized.app ET coach.sessionized.app une
// fois la page de login/register commune en place. Vide en dev : le cookie
// reste host-only, ce qui suffit déjà entre ports sur localhost.
export function setSessionCookie(cookieStore: CookieStore, token: string) {
  cookieStore.set('sessionized_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
  })
}
