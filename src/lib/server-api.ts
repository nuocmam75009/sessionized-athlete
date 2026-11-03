import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE_NAME } from './auth-cookie'
import { backendUrl } from './env'
import { loginPath, REQUEST_PATH_HEADER } from './session'

interface ServerApiResult<T> {
  status: number
  data: T | null
}

// Retour à /login, puis sur la page en cours une fois reconnecté. Le proxy ne
// laisse passer que des jetons non expirés, mais l'API reste seule juge : elle
// refuse aussi un jeton révoqué, signé avec un ancien secret, ou celui d'un
// compte supprimé. Sans cette redirection, la page s'afficherait vide ou en 404.
async function redirectToLogin(expired: boolean): Promise<never> {
  const from = (await headers()).get(REQUEST_PATH_HEADER) ?? '/dashboard'
  redirect(loginPath(from, { expired }))
}

// À utiliser uniquement depuis un Server Component / Route Handler : lit le
// cookie httpOnly (inaccessible en JS client) et le transmet au backend en
// Authorization: Bearer, puisque celui-ci attend un Bearer token et non un
// cookie de session. Renvoie le status HTTP pour distinguer une vraie erreur
// d'un 404 attendu (ex: pas de coach assigné). Un 401 ne revient jamais à
// l'appelant : il redirige vers /login.
export async function serverApiFetchStatus<T>(path: string, options?: RequestInit): Promise<ServerApiResult<T>> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return redirectToLogin(false)

  let result: ServerApiResult<T>
  try {
    const res = await fetch(backendUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
      cache: 'no-store',
    })
    result = res.ok ? { status: res.status, data: await res.json() } : { status: res.status, data: null }
  } catch {
    // Backend injoignable (down, pas encore démarré, réseau) : on dégrade
    // plutôt que de faire planter la page entière.
    result = { status: 0, data: null }
  }

  // Hors du try : redirect() fonctionne en levant une exception.
  if (result.status === 401) return redirectToLogin(true)
  return result
}

export async function serverApiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  const { data } = await serverApiFetchStatus<T>(path, options)
  return data
}
