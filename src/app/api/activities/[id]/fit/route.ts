import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Rattache un .fit à une activité déjà créée (typiquement importée de Strava) :
// l'API remplace alors ses laps par ceux du fichier, avec leur intensité et les
// métriques de foulée que Strava ne donne pas.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const formData = await request.formData()

  // Ne pas fixer Content-Type ici : fetch doit générer lui-même la boundary
  // multipart à partir du FormData transmis.
  const backendRes = await fetch(`${BASE_URL}/activities/${id}/fit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await backendRes.json().catch(() => null)
  return NextResponse.json(data, { status: backendRes.status })
}
