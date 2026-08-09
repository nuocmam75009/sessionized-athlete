import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Le socket.io-client tourne dans le navigateur et a besoin du JWT brut pour
// `auth: { token }` — le cookie httpOnly n'est lisible que côté serveur, donc
// cette route sert de pont ponctuel : elle ne persiste rien côté client, le
// token est juste transmis en mémoire au moment de (re)connecter le socket.
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('sessionized_token')?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ token })
}
