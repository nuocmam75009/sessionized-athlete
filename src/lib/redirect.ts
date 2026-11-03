// Origine fictive : elle ne sert qu'à vérifier que la cible résolue reste sur
// le site.
const INTERNAL_ORIGIN = 'http://internal.invalid'

// N'accepte que des chemins internes ("/plan") pour éviter une redirection
// ouverte vers un domaine externe via le paramètre `redirect`. Le contrôle
// porte sur l'URL telle que le navigateur la résoudra, pas sur la chaîne brute :
// il lit "\" comme "/" et ignore tabulations et retours à la ligne, si bien que
// "/\evil.example" mène aussi loin que "//evil.example".
export function safeRedirectTarget(value: string | null): string {
  if (!value || !value.startsWith('/')) return '/dashboard'
  try {
    const url = new URL(value, INTERNAL_ORIGIN)
    if (url.origin !== INTERNAL_ORIGIN) return '/dashboard'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/dashboard'
  }
}
