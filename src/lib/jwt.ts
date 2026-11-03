// Lit la date d'expiration d'un JWT sans vérifier sa signature : le front ne
// détient pas le secret, le backend reste seul juge de la validité du jeton.
// Ce contrôle sert seulement à renvoyer vers /login un athlète dont la session
// a expiré, au lieu de lui servir des pages vides (chaque appel au backend
// répondant 401). Un jeton illisible est traité comme expiré.

// exp en secondes ; undefined si le jeton n'en déclare pas, null s'il est
// illisible.
function readExp(token: string): number | null | undefined {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload !== 'object' || payload === null) return null
    const { exp } = payload as { exp?: unknown }
    if (exp === undefined) return undefined
    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

export function isJwtExpired(token: string, now: number = Date.now()): boolean {
  const exp = readExp(token)
  // Sans exp, rien ne permet de conclure côté front : le backend tranchera.
  if (exp === undefined) return false
  return exp === null || exp * 1000 <= now
}

// Date à laquelle le cookie qui porte le jeton doit disparaître ; null si le
// jeton ne déclare pas d'expiration (ou est illisible).
export function jwtExpiresAt(token: string): Date | null {
  const exp = readExp(token)
  return typeof exp === 'number' ? new Date(exp * 1000) : null
}
