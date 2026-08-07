import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: NextRequest) {
  const payload = await request.json()

  const backendRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!backendRes.ok) {
    return NextResponse.json({ message: 'Registration failed' }, { status: backendRes.status })
  }

  const { accessToken, user } = await backendRes.json()

  const cookieStore = await cookies()
  cookieStore.set('sessionized_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  return NextResponse.json({ user })
}
