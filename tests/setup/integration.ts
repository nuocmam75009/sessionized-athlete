import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cookieJar } from '../integration/support/cookies'
import { backend } from '../integration/support/backend'

// Hors d'une vraie requête Next, cookies() lève une erreur : on le remplace
// par un faux magasin de cookies que chaque test remplit et inspecte.
vi.mock('next/headers', async () => {
  const { cookieStore } = await import('../integration/support/cookies')
  return { cookies: async () => cookieStore }
})

// 'error' : toute requête vers une route que le test n'a pas déclarée fait
// échouer le test — un appel réseau inattendu est un défaut, pas un détail.
beforeAll(() => backend.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.resetHandlers()
  cookieJar.reset()
})
afterAll(() => backend.close())
