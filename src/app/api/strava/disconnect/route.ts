import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function DELETE() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const backendRes = await fetch(`${BASE_URL}/strava/disconnect`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (backendRes.status === 204) return new NextResponse(null, { status: 204 })
  const data = await backendRes.json().catch(() => null)
  return NextResponse.json(data, { status: backendRes.status })
}
