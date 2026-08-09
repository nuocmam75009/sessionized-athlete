import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setSessionCookie } from '@/lib/auth-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Le backend NestJS renvoie le JWT dans le corps ({ accessToken, user }),
// pas via Set-Cookie. Un cookie httpOnly ne pouvant être posé que par un
// serveur, cette route sert de pont : elle relaie la requête au backend
// puis pose elle-même le cookie sur le domaine du front.
export async function POST(request: NextRequest) {
  const credentials = await request.json()

  const backendRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  if (!backendRes.ok) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: backendRes.status })
  }

  const { accessToken, user } = await backendRes.json()

  const cookieStore = await cookies()
  setSessionCookie(cookieStore, accessToken)

  return NextResponse.json({ user })
}
