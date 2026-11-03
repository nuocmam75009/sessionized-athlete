// URL du backend NestJS, pour les Route Handlers et Server Components
// uniquement : le navigateur n'appelle jamais l'API en direct (tout passe par
// /api/*). Sans préfixe NEXT_PUBLIC_, la variable reste hors du bundle client
// et se lit à l'exécution, pas au build : une même image Docker sert tous les
// environnements, et en conteneur elle peut viser un nom de service interne
// (http://api:3000) qu'un navigateur ne saurait pas résoudre.
//
// Lue à chaque appel plutôt qu'au chargement du module : `next build` importe
// les Route Handlers sans que la variable soit définie.
export function backendUrl(path: string): string {
  const base = process.env.API_URL
  if (!base) throw new Error('API_URL is not set (see .env.example)')
  return `${base.replace(/\/+$/, '')}${path}`
}
