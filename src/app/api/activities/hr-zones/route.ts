import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Segment statique déclaré à côté de [id] : Next fait primer la route statique,
// /api/activities/hr-zones n'est donc jamais interprété comme un id d'activité.
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  // Les bornes sont recopiées telles quelles : l'API exige un datetime ISO
  // complet avec offset et renvoie un 400 explicite sinon, autant laisser ce
  // message remonter jusqu'au client plutôt que de le masquer ici.
  const incoming = request.nextUrl.searchParams
  const params = new URLSearchParams()
  for (const key of ['from', 'to', 'athleteId']) {
    const value = incoming.get(key)
    if (value) params.set(key, value)
  }

  const backendRes = await fetch(`${BASE_URL}/activities/hr-zones?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await backendRes.json().catch(() => null)
  return NextResponse.json(data, { status: backendRes.status })
}
