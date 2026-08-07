import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('sessionized_token')?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const backendRes = await fetch(`${BASE_URL}/users/me`, {
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
