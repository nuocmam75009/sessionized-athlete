import { loginPath } from './session'

// fetch() vers un Route Handler, depuis un composant client. Le proxy ne voit
// que les navigations : une session qui expire pendant que la page est ouverte
// ne se révèle qu'ici, par un 401. On renvoie alors vers /login, avec retour sur
// la page courante, plutôt que d'afficher « réessaie » sur une action qui
// échouerait encore. À ne pas utiliser pour /api/auth/* : un 401 y signifie
// « identifiants erronés ».
export async function clientFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status !== 401) return res

  window.location.assign(loginPath(`${window.location.pathname}${window.location.search}`, { expired: true }))
  // La navigation est lancée : la promesse ne se résout jamais, pour que
  // l'appelant ne fasse pas clignoter un message d'erreur avant de partir.
  return new Promise<Response>(() => {})
}
