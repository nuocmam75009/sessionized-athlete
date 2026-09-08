import { NextRequest, NextResponse } from 'next/server'
import { serverApiFetchStatus } from '@/lib/server-api'
import type { ChatMessage } from '@/lib/types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const query = new URLSearchParams({ limit: request.nextUrl.searchParams.get('limit') ?? '30' })
  const cursor = request.nextUrl.searchParams.get('cursor')
  if (cursor) query.set('cursor', cursor)

  const { status, data } = await serverApiFetchStatus<ChatMessage[]>(
    `/chat/conversations/${id}/messages?${query.toString()}`
  )
  return NextResponse.json(data, { status: status || 502 })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { status, data } = await serverApiFetchStatus<ChatMessage>(`/chat/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return NextResponse.json(data, { status: status || 502 })
}
