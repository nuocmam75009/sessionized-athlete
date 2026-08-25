import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const backendRes = await fetch(`${BASE_URL}/activities/${id}/track`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await backendRes.json().catch(() => null)
  return NextResponse.json(data, { status: backendRes.status })
}
