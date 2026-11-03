import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { isJwtExpired } from '@/lib/jwt'
import { loginPath, REQUEST_PATH_HEADER } from '@/lib/session'

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  // Next a déjà retiré ses paramètres internes (_rsc) de cette URL.
  const from = `${request.nextUrl.pathname}${request.nextUrl.search}`
  if (!token || isJwtExpired(token)) {
    // « Session expirée » seulement s'il y avait une session : un visiteur
    // jamais connecté voit le formulaire sans message.
    const response = NextResponse.redirect(new URL(loginPath(from, { expired: Boolean(token) }), request.url))
    // Un jeton périmé ne sert plus à rien : on l'efface.
    if (token) clearSessionCookie(response.cookies)
    return response
  }

  // Écrasé ici même si le navigateur l'a envoyé : les pages lisent la valeur
  // du proxy, pas celle du client.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(REQUEST_PATH_HEADER, from)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/activities/:path*',
    '/profile/:path*',
    '/coaches/:path*',
    '/athlete-data/:path*',
  ],
}
