import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('sessionized_token')?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()

  // Ne pas fixer Content-Type ici : fetch doit générer lui-même la boundary
  // multipart à partir du FormData transmis.
  const backendRes = await fetch(`${BASE_URL}/activities/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await backendRes.json().catch(() => null)
  return NextResponse.json(data, { status: backendRes.status })
}
