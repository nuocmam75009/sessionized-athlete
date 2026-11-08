import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { backendUrl } from '@/lib/env'

// Suppression du compte (droit à l'effacement). L'API redemande le mot de
// passe et répond 403 s'il est faux : la session reste alors valide, et le
// cookie en place.
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  // Seul le mot de passe est relayé, quoi que contienne le corps reçu.
  const body: unknown = await request.json().catch(() => null)
  const password =
    body && typeof body === 'object' && 'password' in body && typeof body.password === 'string' ? body.password : ''

  let status: number
  try {
    const backendRes = await fetch(backendUrl('/users/me'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    })
    status = backendRes.status
  } catch {
    status = 502
  }

  if (status !== 204) return NextResponse.json({ message: 'Account deletion failed' }, { status })

  // Le compte n'existe plus : sa session non plus.
  clearSessionCookie(cookieStore)
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const backendRes = await fetch(backendUrl(`/users/me`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const data = await backendRes.json().catch(() => null)
  return NextResponse.json(data, { status: backendRes.status })
}
