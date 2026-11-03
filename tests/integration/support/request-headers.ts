// En-têtes de la requête entrante, substitués à headers() de next/headers (voir
// tests/setup/integration.ts) : chaque test y pose ce que le proxy aurait posé.
export const requestHeaders = new Headers()

export function resetRequestHeaders(initial: Record<string, string> = {}) {
  for (const name of [...requestHeaders.keys()]) requestHeaders.delete(name)
  for (const [name, value] of Object.entries(initial)) requestHeaders.set(name, value)
}
