import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { isJwtExpired } from '@/lib/jwt'
import { contentSecurityPolicy, generateNonce, NONCE_HEADER } from '@/lib/security-headers'
import { loginPath, REQUEST_PATH_HEADER } from '@/lib/session'

// Pages réservées à un athlète connecté. Les autres pages (connexion, pages
// légales) passent aussi par le proxy, pour leur Content-Security-Policy.
export const PROTECTED_PREFIXES = ['/dashboard', '/activities', '/profile', '/coaches', '/athlete-data']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  // Next a déjà retiré ses paramètres internes (_rsc) de cette URL.
  const from = `${pathname}${request.nextUrl.search}`
  if (isProtected(pathname) && (!token || isJwtExpired(token))) {
    // « Session expirée » seulement s'il y avait une session : un visiteur
    // jamais connecté voit le formulaire sans message.
    const response = NextResponse.redirect(new URL(loginPath(from, { expired: Boolean(token) }), request.url))
    // Un jeton périmé ne sert plus à rien : on l'efface.
    if (token) clearSessionCookie(response.cookies)
    return response
  }

  // Un nonce neuf par requête : Next le lit dans l'en-tête CSP de la requête
  // pour l'apposer sur ses scripts, le layout racine dans x-nonce.
  const nonce = generateNonce()
  const csp = contentSecurityPolicy(nonce)

  // Écrasés ici même si le navigateur les a envoyés : les pages lisent les
  // valeurs du proxy, pas celles du client.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(REQUEST_PATH_HEADER, from)
  requestHeaders.set(NONCE_HEADER, nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    // Toutes les pages, sauf les routes /api (elles vérifient elles-mêmes le
    // cookie et répondent en JSON, sans HTML à protéger), les fichiers de
    // Next et ceux de public/.
    '/((?!api/|_next/static|_next/image|favicon\\.ico|leaflet/|maplibre/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)',
  ],
}
