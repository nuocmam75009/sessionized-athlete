import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { backendUrl } from '@/lib/env'

// Déconnexion en deux temps :
// 1. l'API révoque le jeton (POST /auth/logout) : même copié avant, il ne
//    sert plus à rien, alors qu'un JWT reste sinon valide jusqu'à son
//    expiration ;
// 2. le cookie est effacé, quoi qu'ait répondu l'API : l'utilisateur qui se
//    déconnecte doit l'être dans ce navigateur, même si l'API est
//    injoignable (le jeton expirera alors de lui-même).
export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  let revoked = false
  if (token) {
    try {
      const backendRes = await fetch(backendUrl('/auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      // 401 : jeton déjà expiré ou déjà révoqué, il ne vaut plus rien.
      revoked = backendRes.status === 204 || backendRes.status === 401
    } catch {
      revoked = false
    }
  }

  clearSessionCookie(cookieStore)
  return NextResponse.json({ ok: true, revoked })
}
