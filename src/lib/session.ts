// Chemin de la page demandée, posé par le proxy sur la requête transmise aux
// pages : un Server Component ne connaît pas son URL, et il en a besoin pour
// renvoyer l'athlète sur la même page une fois reconnecté.
export const REQUEST_PATH_HEADER = 'x-sessionized-path'

// /login?redirect=… : la page de connexion y revient après connexion (le
// paramètre est filtré par safeRedirectTarget). `expired` lui fait expliquer
// pourquoi l'athlète se retrouve là, au lieu d'un formulaire sans contexte.
export function loginPath(from: string, { expired = false }: { expired?: boolean } = {}): string {
  const params = new URLSearchParams({ redirect: from })
  if (expired) params.set('reason', 'expired')
  return `/login?${params.toString()}`
}
