// Lit la date d'expiration d'un JWT sans vérifier sa signature : le front ne
// détient pas le secret, le backend reste seul juge de la validité du jeton.
// Ce contrôle sert seulement à renvoyer vers /login un athlète dont la session
// a expiré, au lieu de lui servir des pages vides (chaque appel au backend
// répondant 401). Un jeton illisible est traité comme expiré.
export function isJwtExpired(token: string, now: number = Date.now()): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return true
  try {
    const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload !== 'object' || payload === null) return true
    const { exp } = payload as { exp?: unknown }
    // Sans exp, rien ne permet de conclure côté front : le backend tranchera.
    if (exp === undefined) return false
    return typeof exp !== 'number' || exp * 1000 <= now
  } catch {
    return true
  }
}
