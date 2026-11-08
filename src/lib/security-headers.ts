// En-têtes de sécurité HTTP de l'app athlète.
//
// - La Content-Security-Policy dépend d'un nonce tiré à chaque requête : elle
//   est posée par le proxy (src/proxy.ts). Next.js applique ce nonce à ses
//   propres scripts, et le layout racine à son script de thème.
// - Les autres en-têtes sont fixes : posés par next.config.ts sur toutes les
//   réponses, fichiers statiques compris.

// Tuiles et styles de la carte (RouteMap) : seule origine externe chargée.
const MAP_TILES_ORIGIN = 'https://tiles.openfreemap.org'

export const NONCE_HEADER = 'x-nonce'

export function generateNonce(): string {
  return btoa(crypto.randomUUID())
}

/**
 * Politique stricte fondée sur un nonce (recommandation de l'OWASP et du
 * guide Next.js) : un script injecté par une faille XSS ne porte pas le nonce
 * de la requête et n'est pas exécuté. 'strict-dynamic' autorise les scripts
 * que chargent les scripts de confiance (morceaux de Next, carte).
 */
export function contentSecurityPolicy(nonce: string, isDev = process.env.NODE_ENV !== 'production'): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // 'unsafe-eval' en développement seulement : le rechargement à chaud
    // de React en a besoin.
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // Attributs style posés par les animations (framer-motion) et Leaflet :
    // un attribut ne peut pas porter de nonce. Le risque d'une injection de
    // style est bien moindre que celui d'un script.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', MAP_TILES_ORIGIN],
    'font-src': ["'self'"],
    // Le navigateur ne parle qu'aux routes /api du front (BFF) et aux tuiles.
    'connect-src': ["'self'", MAP_TILES_ORIGIN],
    // MapLibre décode les tuiles dans un worker créé depuis un blob.
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    // Aucune page ne peut être affichée dans un cadre (clickjacking).
    'frame-ancestors': ["'none'"],
  }
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`)
  if (!isDev) policy.push('upgrade-insecure-requests')
  return policy.join('; ')
}

/** En-têtes fixes, posés sur toutes les réponses par next.config.ts. */
export const STATIC_SECURITY_HEADERS: Array<{ key: string; value: string }> = [
  // HTTPS imposé pendant 2 ans, sous-domaines compris (ignoré en HTTP local).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Doublon de frame-ancestors pour les navigateurs anciens.
  { key: 'X-Frame-Options', value: 'DENY' },
  // L'URL complète (ids d'activité, ?redirect=) ne part pas vers un autre site.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
]
