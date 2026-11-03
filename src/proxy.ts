import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { isJwtExpired } from '@/lib/jwt'

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token || isJwtExpired(token)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    const response = NextResponse.redirect(loginUrl)
    // Un jeton périmé ne sert plus à rien : on l'efface.
    if (token) clearSessionCookie(response.cookies)
    return response
  }
  return NextResponse.next()
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
