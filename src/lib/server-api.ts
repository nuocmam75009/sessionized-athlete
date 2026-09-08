import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from './auth-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

interface ServerApiResult<T> {
  status: number
  data: T | null
}

// À utiliser uniquement depuis un Server Component / Route Handler : lit le
// cookie httpOnly (inaccessible en JS client) et le transmet au backend en
// Authorization: Bearer, puisque celui-ci attend un Bearer token et non un
// cookie de session. Renvoie le status HTTP pour distinguer une vraie erreur
// d'un 404 attendu (ex: pas de coach assigné).
export async function serverApiFetchStatus<T>(path: string, options?: RequestInit): Promise<ServerApiResult<T>> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return { status: 401, data: null }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
      cache: 'no-store',
    })

    if (!res.ok) return { status: res.status, data: null }
    return { status: res.status, data: await res.json() }
  } catch {
    // Backend injoignable (down, pas encore démarré, réseau) : on dégrade
    // plutôt que de faire planter la page entière.
    return { status: 0, data: null }
  }
}

export async function serverApiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  const { data } = await serverApiFetchStatus<T>(path, options)
  return data
}
