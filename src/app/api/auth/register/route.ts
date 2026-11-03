import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setSessionCookie } from '@/lib/auth-cookie'
import { backendUrl } from '@/lib/env'

export async function POST(request: NextRequest) {
  const payload = await request.json()

  const backendRes = await fetch(backendUrl(`/auth/register`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!backendRes.ok) {
    return NextResponse.json({ message: 'Registration failed' }, { status: backendRes.status })
  }

  const { accessToken, user } = await backendRes.json()

  const cookieStore = await cookies()
  setSessionCookie(cookieStore, accessToken)

  return NextResponse.json({ user })
}
