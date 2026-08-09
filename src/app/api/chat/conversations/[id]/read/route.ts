import { NextResponse } from 'next/server'
import { serverApiFetchStatus } from '@/lib/server-api'

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status, data } = await serverApiFetchStatus(`/chat/conversations/${id}/read`, { method: 'PATCH' })
  return NextResponse.json(data, { status: status || 502 })
}
