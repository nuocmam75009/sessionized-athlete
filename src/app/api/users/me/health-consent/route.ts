import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { backendUrl } from '@/lib/env'

// Consentement aux données de santé d'un compte créé avant la case
// d'inscription. La valeur cochée par l'athlète est relayée telle quelle :
// l'API refuse tout autre chose que true.
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json().catch(() => null)
  const healthDataConsent =
    body && typeof body === 'object' && 'healthDataConsent' in body ? body.healthDataConsent : undefined

  let backendRes: Response
  try {
    backendRes = await fetch(backendUrl('/users/me/health-consent'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ healthDataConsent }),
    })
  } catch {
    return NextResponse.json({ message: 'Consent failed' }, { status: 502 })
  }
  if (!backendRes.ok) return NextResponse.json({ message: 'Consent failed' }, { status: backendRes.status })

  return NextResponse.json(await backendRes.json().catch(() => null))
}
