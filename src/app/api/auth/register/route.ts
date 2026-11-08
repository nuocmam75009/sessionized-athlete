import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setSessionCookie } from '@/lib/auth-cookie'
import { registerFailure } from '@/lib/auth-errors'
import { backendUrl } from '@/lib/env'

export async function POST(request: NextRequest) {
  const payload = await request.json()

  const backendRes = await fetch(backendUrl(`/auth/register`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!backendRes.ok) {
    const body: unknown = await backendRes.json().catch(() => null)
    return NextResponse.json(registerFailure(backendRes.status, body, backendRes.headers.get('Retry-After')), {
      status: backendRes.status,
    })
  }

  const { accessToken, user } = await backendRes.json()

  const cookieStore = await cookies()
  setSessionCookie(cookieStore, accessToken)

  return NextResponse.json({ user })
}
