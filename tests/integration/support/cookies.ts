// Faux magasin de cookies, substitué à cookies() de next/headers (voir
// tests/setup/integration.ts). Garde les options passées à set() pour que les
// tests vérifient les attributs du cookie de session (HttpOnly, SameSite…).

export interface RecordedCookie {
  name: string
  value: string
  options: Record<string, unknown>
}

const jar = new Map<string, RecordedCookie>()

export const cookieStore = {
  get(name: string) {
    const cookie = jar.get(name)
    return cookie ? { name, value: cookie.value } : undefined
  },
  set(name: string, value: string, options: Record<string, unknown> = {}) {
    jar.set(name, { name, value, options })
  },
  delete(name: string) {
    jar.delete(name)
  },
}

export const cookieJar = {
  reset(initial: Record<string, string> = {}) {
    jar.clear()
    for (const [name, value] of Object.entries(initial)) jar.set(name, { name, value, options: {} })
  },
  get(name: string): RecordedCookie | undefined {
    return jar.get(name)
  },
}
