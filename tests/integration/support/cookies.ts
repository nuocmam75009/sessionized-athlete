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
  // Même signature que le vrai magasin : un nom, ou les attributs du cookie à
  // effacer (voir clearSessionCookie).
  delete(target: string | { name: string; path?: string; domain?: string }) {
    const { name, ...options } = typeof target === 'string' ? { name: target } : target
    jar.delete(name)
    deletions.push({ name, options })
  },
}

const deletions: Array<{ name: string; options: Record<string, unknown> }> = []

export const cookieJar = {
  reset(initial: Record<string, string> = {}) {
    jar.clear()
    deletions.length = 0
    for (const [name, value] of Object.entries(initial)) jar.set(name, { name, value, options: {} })
  },
  get(name: string): RecordedCookie | undefined {
    return jar.get(name)
  },
  deletions(): ReadonlyArray<{ name: string; options: Record<string, unknown> }> {
    return deletions
  },
}
