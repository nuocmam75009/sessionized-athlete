import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { backendUrl } from '@/lib/env'

// Export de toutes les données de l'athlète (droits d'accès et de portabilité),
// relayé tel quel en flux : le fichier peut être lourd (points GPS, .fit
// d'origine), inutile de le garder en mémoire ici.
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let backendRes: Response
  try {
    backendRes = await fetch(backendUrl('/users/me/export'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ message: 'Export failed' }, { status: 502 })
  }
  if (!backendRes.ok || !backendRes.body) {
    return NextResponse.json({ message: 'Export failed' }, { status: backendRes.status === 200 ? 502 : backendRes.status })
  }

  const day = new Date().toISOString().slice(0, 10)
  return new NextResponse(backendRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="sessionized-export-${day}.json"`,
      // Données de santé : aucun cache intermédiaire ne doit en garder copie.
      'Cache-Control': 'no-store',
    },
  })
}
