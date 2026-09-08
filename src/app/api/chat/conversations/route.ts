import { NextRequest, NextResponse } from 'next/server'
import { serverApiFetchStatus } from '@/lib/server-api'
import type { ChatConversation, ChatMessage } from '@/lib/types'

export async function GET() {
  const { status, data } = await serverApiFetchStatus<ChatConversation[]>('/chat/conversations')
  return NextResponse.json(data, { status: status || 502 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { status, data } = await serverApiFetchStatus<{ conversation: ChatConversation; message: ChatMessage }>(
    '/chat/conversations',
    { method: 'POST', body: JSON.stringify(body) }
  )
  return NextResponse.json(data, { status: status || 502 })
}
