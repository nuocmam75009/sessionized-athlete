import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cookieJar } from '../integration/support/cookies'
import { backend } from '../integration/support/backend'
import { resetRequestHeaders } from '../integration/support/request-headers'

// Hors d'une vraie requête Next, cookies() et headers() lèvent une erreur : on
// les remplace par de faux magasins que chaque test remplit et inspecte.
vi.mock('next/headers', async () => {
  const { cookieStore } = await import('../integration/support/cookies')
  const { requestHeaders } = await import('../integration/support/request-headers')
  return { cookies: async () => cookieStore, headers: async () => requestHeaders }
})

// 'error' : toute requête vers une route que le test n'a pas déclarée fait
// échouer le test — un appel réseau inattendu est un défaut, pas un détail.
beforeAll(() => backend.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.resetHandlers()
  cookieJar.reset()
  resetRequestHeaders()
})
afterAll(() => backend.close())
