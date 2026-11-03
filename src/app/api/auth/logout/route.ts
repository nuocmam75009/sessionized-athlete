import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearSessionCookie } from '@/lib/auth-cookie'

export async function POST() {
  clearSessionCookie(await cookies())
  return NextResponse.json({ ok: true })
}
